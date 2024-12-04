/**
 * An object containing various message types for task management.
 */
export const Events = {
  LoadNav: "LoadNav", // Loads the navigation bar
  LoadMainPage: "LoadMainPage", // Loads the main page (First thing called when application starts up)
  LoadDayPage: "LoadDayPage", // Loads the Day Component with content corresponding to the calendar day
  LoadJournalPage: "LoadJournalPage", // Loads Journal Page, content based on current Day Page
  LoadCheckInPage: "LoadCheckInPage", // Loads Check-in Page
  LoadSummaryPage: "LoadSummaryPage", // Loads Summary Page, context based on all data stored
  LoadQuote: "LoadQuote", 
  StoreData: "StoreData", // Async call to store any changes inputted by user
  ClearData: "ClearData", // Async call to clear all data stored in database
  RestoreData: "RestoreData", // Async call to restore/retrieve data
  RemoveData: "RemoveData", // Async call to remove a specific entry from the database
  UpdateData: "UpdateData", // Async call to update a specific entry in the database

  InitDataSuccess: "InitDataSuccess", // Successful database init call
  StoredDataSuccess: "StoredDataSuccess", // Successful database store call
  RestoredDataSuccess: "RestoredDataSuccess", // Successful database restore call
  ClearedDataSuccess: "ClearedDataSuccess", // Successful database clear call
  RemovedDataSuccess: "RemovedDataSuccess", // Successful database remove call
  UpdatedDataSuccess: "UpdatedDataSuccess", // Successful database update call

  InitDataFailed: "InitDataFailed", // Failed database init call
  StoredDataFailed: "StoredDataFailed", // Failed database store call
  RestoredDataFailed: "RestoredDataFailed", // Failed database restore call
  ClearedDataFailed: "ClearedDataFailed", // Failed database clear call
  RemovedDataFailed: "RemovedDataFailed", // Failed database remove call
  UpdatedDataFailed: "UpdatedDataFailed", // Failed database update call

  StoreEmotion: "StoreEmotion", // Async call to store an emotion entry
  RestoreEmotion: "RestoreEmotion", // Async call to restore/retrieve an emotion entry

  StoreEmotionSuccess: "StoreEmotionSuccess", // Successful emotion store call
  RestoreEmotionSuccess: "RestoreEmotionSuccess", // Successful emotion restore call

  StoreEmotionFailed: "StoreEmotionFailed", // Failed emotion store call
  RestoreEmotionFailed: "RestoreEmotionFailed", // Failed emotion restore call
};
