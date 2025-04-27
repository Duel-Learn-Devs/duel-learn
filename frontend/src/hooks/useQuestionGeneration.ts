import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const useQuestionGeneration = (material: any, selectedTypes: string[], mode: string) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(true);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const hasGeneratedRef = useRef(false);

  const calculateDistribution = (totalItems: number, types: string[]) => {
    if (types.length === 1) {
      return { [types[0]]: totalItems };
    }

    const distribution: Record<string, number> = {};
    let remainingItems = totalItems;
    let remainingTypes = types.length;

    types.forEach((type) => {
      const itemsForType = Math.floor(remainingItems / remainingTypes);
      distribution[type] = itemsForType;
      remainingItems -= itemsForType;
      remainingTypes--;
    });

    if (remainingItems > 0) {
      distribution[types[types.length - 1]] += remainingItems;
    }

    return distribution;
  };

  useEffect(() => {
    let mounted = true;

    const generateAIQuestions = async () => {
      if (hasGeneratedRef.current || !material?.study_material_id || !selectedTypes.length) {
        return;
      }

      console.log("Starting AI question generation");
      setIsGeneratingAI(true);
      const generatedQuestions = [];

      try {
        const items = [...material.items];
        const shuffledItems = items.sort(() => Math.random() - 0.5);
        const totalItems = items.length;
        
        const distribution = calculateDistribution(totalItems, selectedTypes);
        let currentItemIndex = 0;

        for (const type of selectedTypes) {
          const questionsOfThisType = distribution[type];
          
          for (let i = 0; i < questionsOfThisType; i++) {
            const item = shuffledItems[currentItemIndex];
            
            console.log('Processing item:', {
              item_id: item.item_id,
              item_number: item.item_number,
              term: item.term
            });

            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/openai/generate-${type}`;
            const requestPayload = {
              term: item.term,
              definition: item.definition,
              numberOfItems: 1,
              studyMaterialId: material.study_material_id,
              itemId: item.item_id,
              itemNumber: item.item_number,
              gameMode: mode.toLowerCase(),
              timestamp: new Date().getTime()
            };

            try {
              const response = await axios.post<any[]>(endpoint, requestPayload);
              
              if (response.data?.[0]) {
                const questionData = response.data[0];
                const questionWithInfo = {
                  ...questionData,
                  question_type: type,
                  answer: questionData.correctAnswer,
                  item_id: item.item_id,
                  item_number: item.item_number,
                  itemInfo: {
                    term: item.term,
                    definition: item.definition,
                    itemId: item.item_id,
                    itemNumber: item.item_number
                  }
                };
                generatedQuestions.push(questionWithInfo);
              }
            } catch (error) {
              console.error(`Error generating ${type} question:`, error);
            }

            currentItemIndex++;
          }
        }

        if (mounted) {
          const shuffledQuestions = generatedQuestions.sort(() => Math.random() - 0.5);
          setAiQuestions(shuffledQuestions);
          hasGeneratedRef.current = true;
        }
      } catch (error) {
        console.error("Error generating AI questions:", error);
        if (mounted) {
          setAiQuestions([]);
        }
      } finally {
        if (mounted) {
          setIsGeneratingAI(false);
        }
      }
    };

    generateAIQuestions();

    return () => {
      mounted = false;
    };
  }, [material?.study_material_id, selectedTypes, mode]);

  return { isGeneratingAI, aiQuestions };
}; 