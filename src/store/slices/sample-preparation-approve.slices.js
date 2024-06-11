import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"; 
import SamplePreparationService from "../../service/SamplePreparation.service";
const spService = SamplePreparationService();

const initialValues = 
{
    waiting_approve : 0,
    loading : false,
};

export const waitingApproved = createAsyncThunk( "approved/waitingApproved",
async () => {
    const res = await spService.waiting_approved();
    const { ctn } = res.data.data
    return Number(ctn) || null;
  }
);

const waitingApprovedSlice = createSlice({
  name: "approved",
  initialState: initialValues,
  reducers: {
    reset: () => initialValues,
  },
  extraReducers: (builder) => {
    builder.addCase(waitingApproved.fulfilled, (state, action) => {
    //   console.log(action, "fulfilled");
      state.waiting_approve = action.payload;
      state.loading = true;

      // console.log(action.payload, current(state));
    });

    builder.addCase(waitingApproved.rejected, (state, action) => {
    //   console.log(action, "rejected"); 
      state.waiting_approve = 0;
      state.loading = true;
    });

    builder.addCase(waitingApproved.pending, (state, action) => {
      //state.waiting_approve = 0;
      //console.log(current(state), 'pending');
      //state.loading = true;
    });
  },
});

// export const { waitingApproved } = waitingApprovedSlice.actions;
export const { reset } = waitingApprovedSlice.actions;
export const waitingApprovedSliceSelector = (store) => store.waitingApprovedSlice;
export default waitingApprovedSlice.reducer;