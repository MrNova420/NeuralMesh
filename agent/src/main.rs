use anyhow::Result;
use clap::Parser;
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use sysinfo::{Disks, Networks, System};
use tokio::time::{interval, Duration};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use uuid::Uuid;

#[derive(Parser, Debug)]
#[command(name = "neuralmesh-agent")]
#[command(about = "NeuralMesh Node Agent - Collects system metrics and reports to server")]
struct Args {
    /// Server WebSocket URL
    #[arg(short, long, default_value = "ws://localhost:3001")]
    server: String,

    /// Node name (auto-generated if not provided)
    #[arg(short, long)]
    name: Option<String>,

    /// Update interval in seconds
    #[arg(short, long, default_value = "2")]
    interval: u64,
}

#[derive(Debug, Serialize)]
struct NodeInfo {
    id: String,
    name: String,
    #[serde(rename = "type")]
    node_type: String,
    specs: Specs,
    location: Location,
    platform: Platform,
}

#[derive(Debug, Serialize)]
struct Specs {
    cpu: CpuInfo,
    memory: MemoryInfo,
    storage: StorageInfo,
    network: NetworkInfo,
}

#[derive(Debug, Serialize)]
struct CpuInfo {
    cores: usize,
    usage: f32,
    model: String,
}

#[derive(Debug, Serialize)]
struct MemoryInfo {
    total: u64,
    used: u64,
    usage: f32,
}

#[derive(Debug, Serialize)]
struct StorageInfo {
    total: u64,
    used: u64,
    usage: f32,
}

#[derive(Debug, Serialize)]
struct NetworkInfo {
    rx: u64,
    tx: u64,
}

#[derive(Debug, Serialize)]
struct Location {
    region: String,
    ip: String,
}

#[derive(Debug, Serialize)]
struct Platform {
    os: String,
    arch: String,
    hostname: String,
}

fn get_node_type(cpu_cores: usize, memory_gb: u64) -> &'static str {
    if cpu_cores >= 16 && memory_gb >= 32 {
        "alpha" // High-end server
    } else if cpu_cores >= 8 && memory_gb >= 16 {
        "beta" // Mid-tier server
    } else if cpu_cores >= 4 {
        "gamma" // Mobile/Desktop
    } else {
        "delta" // IoT/Raspberry Pi
    }
}

fn collect_metrics(sys: &mut System) -> Result<NodeInfo> {
    sys.refresh_all();

    let cpu_cores = sys.cpus().len();
    let cpu_usage = sys.cpus().iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpu_cores as f32;
    let cpu_model = sys.cpus().first().map(|cpu| cpu.brand()).unwrap_or("Unknown").to_string();

    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let memory_usage = (used_memory as f32 / total_memory as f32) * 100.0;

    let disks = Disks::new_with_refreshed_list();
    let (total_storage, used_storage) = disks.iter().fold((0u64, 0u64), |(total, used), disk| {
        (
            total + disk.total_space(),
            used + (disk.total_space() - disk.available_space()),
        )
    });
    let storage_usage = if total_storage > 0 {
        (used_storage as f32 / total_storage as f32) * 100.0
    } else {
        0.0
    };

    let networks = Networks::new_with_refreshed_list();
    let (rx, tx) = networks.iter().fold((0u64, 0u64), |(rx, tx), (_name, network)| {
        (rx + network.received(), tx + network.transmitted())
    });

    let hostname = System::host_name().unwrap_or_else(|| "unknown".to_string());
    let os = System::name().unwrap_or_else(|| "unknown".to_string());
    let arch = System::cpu_arch();

    let local_ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string());

    let node_type = get_node_type(cpu_cores, total_memory / 1024 / 1024 / 1024);
    let node_name = format!("{}-{}", node_type, &hostname[..hostname.len().min(8)]);

    Ok(NodeInfo {
        id: Uuid::new_v4().to_string(),
        name: node_name,
        node_type: node_type.to_string(),
        specs: Specs {
            cpu: CpuInfo {
                cores: cpu_cores,
                usage: cpu_usage,
                model: cpu_model,
            },
            memory: MemoryInfo {
                total: total_memory,
                used: used_memory,
                usage: memory_usage,
            },
            storage: StorageInfo {
                total: total_storage,
                used: used_storage,
                usage: storage_usage,
            },
            network: NetworkInfo { rx, tx },
        },
        location: Location {
            region: "local".to_string(),
            ip: local_ip,
        },
        platform: Platform {
            os,
            arch,
            hostname,
        },
    })
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    println!("🧠 NeuralMesh Node Agent v0.1.0");
    println!("📡 Connecting to {}", args.server);

    let mut sys = System::new_all();
    let mut update_interval = interval(Duration::from_secs(args.interval));

    // Connect to WebSocket server
    let (ws_stream, _) = connect_async(&args.server).await?;
    println!("✅ Connected to server");

    let (mut write, mut read) = ws_stream.split();

    // Send initial node info
    let node_info = collect_metrics(&mut sys)?;
    println!("📊 Node: {} ({})", node_info.name, node_info.node_type);
    println!("   CPU: {} cores @ {:.1}%", node_info.specs.cpu.cores, node_info.specs.cpu.usage);
    println!("   Memory: {:.1} GB ({:.1}%)", 
        node_info.specs.memory.total as f64 / 1024.0 / 1024.0 / 1024.0,
        node_info.specs.memory.usage
    );

    let register_msg = serde_json::json!({
        "event": "node:register",
        "data": node_info
    });
    write.send(Message::Text(register_msg.to_string())).await?;

    // Main loop: send metrics periodically
    loop {
        tokio::select! {
            _ = update_interval.tick() => {
                let metrics = collect_metrics(&mut sys)?;
                let msg = serde_json::json!({
                    "event": "node:metrics",
                    "data": metrics
                });
                
                if let Err(e) = write.send(Message::Text(msg.to_string())).await {
                    eprintln!("❌ Failed to send metrics: {}", e);
                    break;
                }
                
                print!("📤 Sent metrics (CPU: {:.1}%, MEM: {:.1}%) ", 
                    metrics.specs.cpu.usage, 
                    metrics.specs.memory.usage
                );
                println!("");
            }
            
            msg = read.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        println!("📥 Received: {}", text);
                    }
                    Some(Ok(Message::Close(_))) => {
                        println!("🔌 Server closed connection");
                        break;
                    }
                    Some(Err(e)) => {
                        eprintln!("❌ WebSocket error: {}", e);
                        break;
                    }
                    None => break,
                    _ => {}
                }
            }
        }
    }

    println!("👋 Agent shutting down");
    Ok(())
}
