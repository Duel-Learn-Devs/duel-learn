/**
 * Generates a random alphanumeric code of specified length
 * @param length Length of the code to generate (default: 6)
 * @returns Generated code string
 */
export const generateCode = (length: number = 6): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}; 