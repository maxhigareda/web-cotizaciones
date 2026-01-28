const fs = require('fs');
const path = require('path');

// User provided logo path in artifacts
const siLogoPath = 'C:/Users/tomas/.gemini/antigravity/brain/5caad092-9af9-4bf1-abbb-ad2eaed35c96/uploaded_media_1769621996887.png';
const logosTsPath = path.join(__dirname, '../lib/logos.ts');

try {
    const siB64 = fs.readFileSync(siLogoPath, 'base64');

    // Read existing file to keep Nestle logo
    let currentContent = fs.readFileSync(logosTsPath, 'utf8');

    // Replace the placeholder or update the const
    // We expect: export const LOGO_SI = ''; // Placeholder...
    // We will replace the entire definition of LOGO_SI

    const newDefinition = `export const LOGO_SI = 'data:image/png;base64,${siB64}';`;

    // Regex to satisfy both empty string and potential previous content if any
    const regex = /export const LOGO_SI = ['"`].*['"`];?(\s*\/\/.*)?/g;

    if (currentContent.match(regex)) {
        currentContent = currentContent.replace(regex, newDefinition);
    } else {
        // Append if not found (should be there though)
        currentContent += `\n${newDefinition}\n`;
    }

    fs.writeFileSync(logosTsPath, currentContent);
    console.log('Successfully updated LOGO_SI in lib/logos.ts');
} catch (error) {
    console.error('Error updating logos:', error);
    process.exit(1);
}
