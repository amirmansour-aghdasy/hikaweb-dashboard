const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, "../favicon.ico");
const outputDir = path.join(__dirname, "../public/icons");

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
    try {
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            console.error(`Error: ${inputFile} not found`);
            process.exit(1);
        }

        console.log("Generating PWA icons...");

        // Generate icons for each size
        for (const size of sizes) {
            const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
            
            try {
                await sharp(inputFile)
                    .resize(size, size, {
                        fit: "contain",
                        background: { r: 255, g: 255, b: 255, alpha: 0 }
                    })
                    .png()
                    .toFile(outputFile);
                
                console.log(`✓ Created ${outputFile}`);
            } catch (error) {
                console.error(`✗ Failed to create ${outputFile}:`, error.message);
            }
        }

        // Also create apple-touch-icon (180x180)
        const appleIcon = path.join(outputDir, "apple-touch-icon.png");
        try {
            await sharp(inputFile)
                .resize(180, 180, {
                    fit: "contain",
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(appleIcon);
            
            console.log(`✓ Created ${appleIcon}`);
        } catch (error) {
            console.error(`✗ Failed to create ${appleIcon}:`, error.message);
        }

        console.log("\n✅ All icons generated successfully!");
    } catch (error) {
        console.error("Error generating icons:", error);
        process.exit(1);
    }
}

generateIcons();

