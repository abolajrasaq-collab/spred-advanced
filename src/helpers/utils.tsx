export const truncateText = (text: string, maxLength: number = 35) => {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength - 3);
  return truncated + '...';
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Function to clean hash codes and IDs from movie titles
export const cleanMovieTitle = (title: string): string => {
  if (!title) {
    return 'Unknown Title';
  }

  return (
    title
      // Remove hash codes (like #1234567890abcdef)
      .replace(/#[a-fA-F0-9]{8,}/g, '')
      // Remove UUID-like patterns
      .replace(
        /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g,
        '',
      )
      // Remove random hex codes
      .replace(/\b[a-fA-F0-9]{16,}\b/g, '')
      // Remove underscores and multiple spaces
      .replace(/[_\s]+/g, ' ')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
};
