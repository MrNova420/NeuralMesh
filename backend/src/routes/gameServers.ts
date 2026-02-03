import express from 'express';
import { gameServerManagementService } from '../services/gameServerManagementService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ========== VERSION MANAGEMENT ==========

router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const { game } = req.query;
    
    const versions = await gameServerManagementService.getAvailableVersions(id, game as string || 'minecraft');
    res.json(versions);
  } catch (error: any) {
    logger.error('Error getting versions:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/version', async (req, res) => {
  try {
    const { id } = req.params;
    const { version, backup } = req.body;
    
    await gameServerManagementService.changeVersion(id, version, backup);
    res.json({ success: true, message: `Version changed to ${version}` });
  } catch (error: any) {
    logger.error('Error changing version:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== MOD/PLUGIN MANAGEMENT ==========

router.get('/:id/mods', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mods = await gameServerManagementService.getInstalledMods(id);
    res.json(mods);
  } catch (error: any) {
    logger.error('Error getting mods:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/mods/search', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, game } = req.query;
    
    const mods = await gameServerManagementService.searchMods(id, query as string, game as string || 'minecraft');
    res.json(mods);
  } catch (error: any) {
    logger.error('Error searching mods:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/mods/install', async (req, res) => {
  try {
    const { id } = req.params;
    const { modId, version } = req.body;
    
    await gameServerManagementService.installMod(id, modId, version);
    res.json({ success: true, message: 'Mod installed successfully' });
  } catch (error: any) {
    logger.error('Error installing mod:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/mods/:modId', async (req, res) => {
  try {
    const { id, modId } = req.params;
    
    await gameServerManagementService.uninstallMod(id, modId);
    res.json({ success: true, message: 'Mod uninstalled successfully' });
  } catch (error: any) {
    logger.error('Error uninstalling mod:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/mods/:modId/toggle', async (req, res) => {
  try {
    const { id, modId } = req.params;
    const { enabled } = req.body;
    
    await gameServerManagementService.toggleMod(id, modId, enabled);
    res.json({ success: true, message: `Mod ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error: any) {
    logger.error('Error toggling mod:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/mods/:modId/update', async (req, res) => {
  try {
    const { id, modId } = req.params;
    const { version } = req.body;
    
    await gameServerManagementService.updateMod(id, modId, version);
    res.json({ success: true, message: 'Mod updated successfully' });
  } catch (error: any) {
    logger.error('Error updating mod:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CONSOLE MANAGEMENT ==========

router.get('/:id/console', async (req, res) => {
  try {
    const { id } = req.params;
    const { lines } = req.query;
    
    const output = await gameServerManagementService.getConsoleOutput(id, lines ? parseInt(lines as string) : 100);
    res.json(output);
  } catch (error: any) {
    logger.error('Error getting console output:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/console/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;
    
    const result = await gameServerManagementService.sendConsoleCommand(id, command);
    res.json(result);
  } catch (error: any) {
    logger.error('Error sending console command:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PLAYER MANAGEMENT ==========

router.get('/:id/players', async (req, res) => {
  try {
    const { id } = req.params;
    
    const players = await gameServerManagementService.getOnlinePlayers(id);
    res.json(players);
  } catch (error: any) {
    logger.error('Error getting players:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/players/:player/kick', async (req, res) => {
  try {
    const { id, player } = req.params;
    const { reason } = req.body;
    
    await gameServerManagementService.kickPlayer(id, player, reason);
    res.json({ success: true, message: `Player ${player} kicked` });
  } catch (error: any) {
    logger.error('Error kicking player:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/players/:player/ban', async (req, res) => {
  try {
    const { id, player } = req.params;
    const { reason, duration } = req.body;
    
    await gameServerManagementService.banPlayer(id, player, reason, duration);
    res.json({ success: true, message: `Player ${player} banned` });
  } catch (error: any) {
    logger.error('Error banning player:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/players/:player/unban', async (req, res) => {
  try {
    const { id, player } = req.params;
    
    await gameServerManagementService.unbanPlayer(id, player);
    res.json({ success: true, message: `Player ${player} unbanned` });
  } catch (error: any) {
    logger.error('Error unbanning player:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/players/:player/whitelist', async (req, res) => {
  try {
    const { id, player } = req.params;
    const { add } = req.body;
    
    await gameServerManagementService.whitelistPlayer(id, player, add);
    res.json({ success: true, message: `Player ${player} ${add ? 'added to' : 'removed from'} whitelist` });
  } catch (error: any) {
    logger.error('Error managing whitelist:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/players/:player/op', async (req, res) => {
  try {
    const { id, player } = req.params;
    const { add } = req.body;
    
    await gameServerManagementService.opPlayer(id, player, add);
    res.json({ success: true, message: `Player ${player} ${add ? 'opped' : 'deopped'}` });
  } catch (error: any) {
    logger.error('Error managing op:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== BACKUP MANAGEMENT ==========

router.get('/:id/backups', async (req, res) => {
  try {
    const { id } = req.params;
    
    const backups = await gameServerManagementService.listBackups(id);
    res.json(backups);
  } catch (error: any) {
    logger.error('Error listing backups:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/backups', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, worlds } = req.body;
    
    const backup = await gameServerManagementService.createBackup(id, name, worlds);
    res.json(backup);
  } catch (error: any) {
    logger.error('Error creating backup:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/backups/:backupId/restore', async (req, res) => {
  try {
    const { id, backupId } = req.params;
    
    await gameServerManagementService.restoreBackup(id, backupId);
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error: any) {
    logger.error('Error restoring backup:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/backups/:backupId', async (req, res) => {
  try {
    const { id, backupId } = req.params;
    
    await gameServerManagementService.deleteBackup(id, backupId);
    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== FILE MANAGEMENT ==========

router.get('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const { path } = req.query;
    
    const files = await gameServerManagementService.browseFiles(id, path as string || '/');
    res.json(files);
  } catch (error: any) {
    logger.error('Error browsing files:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/files/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { path } = req.query;
    
    const content = await gameServerManagementService.readFile(id, path as string);
    res.json({ content });
  } catch (error: any) {
    logger.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/files/write', async (req, res) => {
  try {
    const { id } = req.params;
    const { path, content, backup } = req.body;
    
    await gameServerManagementService.writeFile(id, path, content, backup);
    res.json({ success: true, message: 'File saved successfully' });
  } catch (error: any) {
    logger.error('Error writing file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/files/upload', async (req, res) => {
  try {
    const { id } = req.params;
    const { path, file } = req.body;
    
    // In real implementation, use multipart/form-data parser like multer
    const fileData = Buffer.from(file, 'base64');
    await gameServerManagementService.uploadFile(id, path, fileData);
    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error: any) {
    logger.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/files/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { path } = req.query;
    
    const fileData = await gameServerManagementService.downloadFile(id, path as string);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path}"`);
    res.send(fileData);
  } catch (error: any) {
    logger.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const { path } = req.body;
    
    await gameServerManagementService.deleteFile(id, path);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CONFIGURATION MANAGEMENT ==========

router.get('/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const { file } = req.query;
    
    const config = await gameServerManagementService.getConfiguration(id, file as string);
    res.json(config);
  } catch (error: any) {
    logger.error('Error getting configuration:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const { config, file } = req.body;
    
    await gameServerManagementService.updateConfiguration(id, config, file);
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error: any) {
    logger.error('Error updating configuration:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SCHEDULE MANAGEMENT ==========

router.get('/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedules = await gameServerManagementService.getSchedules(id);
    res.json(schedules);
  } catch (error: any) {
    logger.error('Error getting schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/schedules', async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body;
    
    await gameServerManagementService.updateSchedules(id, schedules);
    res.json({ success: true, message: 'Schedules updated successfully' });
  } catch (error: any) {
    logger.error('Error updating schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PERFORMANCE MONITORING ==========

router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.query;
    
    const metrics = await gameServerManagementService.getPerformanceMetrics(id, duration ? parseInt(duration as string) : 3600);
    res.json(metrics);
  } catch (error: any) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
