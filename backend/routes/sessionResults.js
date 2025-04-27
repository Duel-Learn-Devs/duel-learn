router.post('/save', async (req, res) => {
  try {
    const { studyMaterialId, mode, questions } = req.body;

    // Don't try to save questions again if they were already saved during generation
    if (questions) {
      console.log(`Skipping question save for ${studyMaterialId} in ${mode} mode - questions already saved during generation`);
    }

    // Save only the session results
    const result = await SessionResults.query().insert({
      // ... session result data
    });

    res.json({
      success: true,
      message: 'Session results saved successfully',
      studyMaterialId
    });
  } catch (error) {
    console.error('Error saving session results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save session results',
      error: error.message
    });
  }
}); 