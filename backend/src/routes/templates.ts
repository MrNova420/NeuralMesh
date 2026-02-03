import express from 'express';
import { templateService } from '../services/templateService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all templates or filter by category
router.get('/list', (req, res) => {
  try {
    const category = req.query.category as string || 'all';
    const templates = templateService.getTemplatesByCategory(category);
    
    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    logger.error('Error listing templates:', error);
    res.status(500).json({ success: false, message: 'Failed to list templates' });
  }
});

// Get template by ID
router.get('/:id', (req, res) => {
  try {
    const template = templateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    logger.error('Error getting template:', error);
    res.status(500).json({ success: false, message: 'Failed to get template' });
  }
});

// Get all categories
router.get('/categories/list', (req, res) => {
  try {
    const categories = templateService.getCategories();
    res.json({ success: true, categories });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
});

// Deploy template
router.post('/:id/deploy', async (req, res) => {
  try {
    const { config } = req.body;
    const result = await templateService.deployTemplate(req.params.id, config);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error deploying template:', error);
    res.status(500).json({ success: false, message: 'Failed to deploy template' });
  }
});

export default router;
