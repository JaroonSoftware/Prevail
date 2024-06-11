import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import samplePreparationSlice from "./slices/sample-preparation.slices"; 
import waitingApprovedSlice from "./slices/sample-preparation-approve.slices";

const reducer = {
  samplePreparationSlice,
  waitingApprovedSlice,
};

export const store = configureStore({
  reducer,
  devTools: process.env.NODE_ENV === "development",
});

// export type of root state from reducers 
export const useAppDispatch = () => useDispatch();