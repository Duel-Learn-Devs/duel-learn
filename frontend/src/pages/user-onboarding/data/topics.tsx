// src/data/topics.ts

import { School, Science, Code, MusicNote, History, Psychology, LocalLibrary, Group, Language, Gavel } from "@mui/icons-material";

// Define the type for subjects which includes both name and icon
export interface Subject {
    name: string;
    icon: JSX.Element;
}

export interface Topic {
    topic: string;
    subjects: Subject[];
}

export const topics: Topic[] = [
    {
        topic: "STEM (Science, Technology, Engineering, Mathematics)",
        subjects: [
            { name: "Mathematics", icon: <School /> },
            { name: "Physics", icon: <Science /> },
            { name: "Biology", icon: <Science /> },
            { name: "Computer Science", icon: <Code /> },
            { name: "Chemistry", icon: <Science /> },
            { name: "Engineering", icon: <Code /> },
            { name: "Statistics", icon: <School /> },
            { name: "Astronomy", icon: <Science /> },
        ],
    },
    {
        topic: "Humanities and Social Sciences",
        subjects: [
            { name: "History", icon: <History /> },
            { name: "Psychology", icon: <Psychology /> },
            { name: "Philosophy", icon: <LocalLibrary /> },
            { name: "Sociology", icon: <Group /> },
            { name: "Political Science", icon: <School /> },
            { name: "Anthropology", icon: <Group /> },
            { name: "Geography", icon: <School /> },
            { name: "Economics", icon: <School /> },
            { name: "Linguistics", icon: <Language /> },
        ],
    },
    {
        topic: "Language and Literature",
        subjects: [
            { name: "English Literature", icon: <LocalLibrary /> },
            { name: "Linguistics", icon: <Language /> },
            { name: "Creative Writing", icon: <LocalLibrary /> },
            { name: "Poetry", icon: <LocalLibrary /> },
            { name: "Modern Languages", icon: <Language /> },
            { name: "Comparative Literature", icon: <LocalLibrary /> },
            { name: "Rhetoric", icon: <Language /> },
            { name: "Drama", icon: <LocalLibrary /> },
            { name: "Translation Studies", icon: <Language /> },
        ],
    },
    {
        topic: "Other Academic Fields",
        subjects: [
            { name: "Economics", icon: <School /> },
            { name: "Business Studies", icon: <School /> },
            { name: "Art", icon: <School /> },
            { name: "Music", icon: <MusicNote /> },
            { name: "Environmental Science", icon: <Science /> },
            { name: "Political Science", icon: <School /> },
            { name: "Astronomy", icon: <Science /> },
            { name: "Philosophy", icon: <LocalLibrary /> },
            { name: "Psychology", icon: <Psychology /> },
            { name: "Geography", icon: <School /> },
            { name: "Architecture", icon: <School /> },
            { name: "Law", icon: <Gavel /> },
            { name: "Sociology", icon: <Group /> },
            { name: "Linguistics", icon: <Language /> },
            { name: "Anthropology", icon: <Group /> },
            { name: "Engineering", icon: <Code /> },
        ],
    },
];
