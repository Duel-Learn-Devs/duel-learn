import React, { useState, useEffect } from "react";
import { Box, Typography, Tabs, Tab, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { StudyMaterial } from "../../../../types/studyMaterial";

const StudyMaterialPreview = () => {
  const [activeTab, setActiveTab] = useState("SUMMARY");
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const { studyMaterialId } = useParams();

  useEffect(() => {
    const fetchStudyMaterial = async () => {
      if (!studyMaterialId) {
        console.log('No studyMaterialId provided');
        return;
      }

      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/study-material/get-by-study-material-id/${studyMaterialId}`;
        console.log('Fetching from URL:', url);

        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch study material: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw data received:', data);
        console.log('Summary in received data:', data.summary);

        setMaterial(data);
      } catch (error) {
        console.error('Error fetching study material:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyMaterial();
  }, [studyMaterialId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="SUMMARY" label="SUMMARY" />
        <Tab value="CARDS" label="CARDS" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === "SUMMARY" && (
            <Box sx={{ p: 4 }}>
              {material?.summary ? (
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#322168",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.8,
                      fontSize: "1.1rem",
                      backgroundColor: "#f8f7fd",
                      padding: 3,
                      borderRadius: 2,
                      border: "1px solid #e0dcf5"
                    }}
                  >
                    {typeof material.summary === 'string' 
                      ? material.summary 
                      : typeof material.summary === 'object' && material.summary.definition 
                        ? material.summary.definition
                        : 'No summary available'}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="body1"
                  sx={{ color: "#666", fontStyle: "italic" }}
                >
                  No summary available for this study material.
                </Typography>
              )}
            </Box>
          )}
          
          {activeTab === "CARDS" && (
            <Box sx={{ p: 2 }}>
              {/* Cards content */}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default StudyMaterialPreview; 