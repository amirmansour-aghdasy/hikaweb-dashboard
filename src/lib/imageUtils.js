/**
 * Image utility functions for cropping and editing
 */

/**
 * Create a cropped image from the original image
 * @param {string} imageSrc - Source image URL
 * @param {Object} pixelCrop - Crop area in pixels { x, y, width, height }
 * @param {number} rotation - Rotation angle in degrees
 * @param {Object} flip - Flip settings { horizontal: boolean, vertical: boolean }
 * @returns {Promise<Blob>} - Cropped image blob
 */
export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = pixelCrop.width * pixelRatio * scaleX;
    canvas.height = pixelCrop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = pixelCrop.x * scaleX;
    const cropY = pixelCrop.y * scaleY;

    const rotateRads = (rotation * Math.PI) / 180;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();

    // Move to center of image
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate(rotateRads);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight
    );

    ctx.restore();

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            },
            'image/jpeg',
            0.95
        );
    });
}

/**
 * Create an image element from a URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}

