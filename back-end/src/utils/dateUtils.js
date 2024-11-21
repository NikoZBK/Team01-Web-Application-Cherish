// Returns the current date as a string in the format "MM-DD-YYYY"
function getToday() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();
  return `${month}-${day}-${year}`;
}

export { getToday };
