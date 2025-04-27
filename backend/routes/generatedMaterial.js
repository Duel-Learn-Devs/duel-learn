router.delete('/clear/:studyMaterialId', async (req, res) => {
  try {
    const { studyMaterialId } = req.params;
    
    // Delete all questions for this study material
    await pool.query(
      'DELETE FROM generated_material WHERE study_material_id = ?',
      [studyMaterialId]
    );
    
    res.json({ message: 'Successfully cleared existing questions' });
  } catch (error) {
    console.error('Error clearing questions:', error);
    res.status(500).json({ error: 'Failed to clear existing questions' });
  }
}); 