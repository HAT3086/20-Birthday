// Normal play requires all twenty stars. Enable only for a temporary review.
export const BIRTHDAY_PREVIEW_ENABLED = false;
export const canOpenBirthday = (stars, preview = BIRTHDAY_PREVIEW_ENABLED) => preview || stars === 20;
