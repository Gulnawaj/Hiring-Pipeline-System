/**
 * A simple utility for conditionally joining Tailwind CSS class names.
 * Filters out falsy values (false, null, undefined, 0, "") and joins the rest with a space.
 * 
 * @param  {...any} classes - Any number of arguments to conditionally join.
 * @returns {string} The joined class names.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
