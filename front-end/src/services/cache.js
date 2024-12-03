// stores the data in memory for quick access
const cache = [];

const indexOfDayCache = (id) => {
  if (!cache["data"] || !cache["data"].length) {
    return -1;
  }
  cache["data"].indexOf((day) => day?.date_id === id);
};

export { cache, indexOfDayCache };
