/**
 * Format a date string to "April 15, 2001" format
 * @param dateString - ISO date string (e.g., "2001-04-15" or "2001-04-15T10:30:00")
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return dateString;
  }
};

/**
 * Format a datetime string to "April 15, 2001, 3:30 PM" format
 * @param dateTimeString - ISO datetime string (e.g., "2001-04-15T15:30:00")
 * @returns Formatted datetime string or empty string if invalid
 */
export const formatDateTime = (
  dateTimeString: string | null | undefined,
): string => {
  if (!dateTimeString) return "";

  try {
    const date = new Date(dateTimeString);

    // Check if date is valid
    if (isNaN(date.getTime())) return dateTimeString;

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const datePart = date.toLocaleDateString("en-US", dateOptions);
    const timePart = date.toLocaleTimeString("en-US", timeOptions);

    return `${datePart}, ${timePart}`;
  } catch (error) {
    return dateTimeString;
  }
};

/**
 * Format a time string to 12-hour format "3:30 PM"
 * @param timeString - Time string (e.g., "15:30:00" or full ISO datetime)
 * @returns Formatted time string or empty string if invalid
 */
export const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return "";

  try {
    let date: Date;

    // If it's just a time (HH:mm or HH:mm:ss), prepend a date
    if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      date = new Date(`2000-01-01T${timeString}`);
    } else {
      date = new Date(timeString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) return timeString;

    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleTimeString("en-US", options);
  } catch (error) {
    return timeString;
  }
};
