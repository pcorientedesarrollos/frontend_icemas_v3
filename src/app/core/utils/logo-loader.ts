// Helper function to load logo as base64
export async function loadLogoAsBase64(): Promise<string | null> {
    try {
        const response = await fetch('/image/Logo_icemas2.png');
        const blob = await response.blob();

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error loading logo:', error);
        return null;
    }
}
