import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit"; 
 
const initialValues = [
    {
        total: 0,
        lost: 0,
        afterLost: 0,
        wt_after_lost: 0,
        cost_total: 0,
        cost_after_lost: 0,
        details:[],
        loading: false,
    }
];

const addjustAfterLost = ( state ) =>{
  const tmpState = [...current(state)];
  const uStateLength = tmpState.length - 1;
  for( let i = 0; i <= uStateLength; i++){
      let currTmp = {...tmpState[i]};
      
      const lost = currTmp.lost;
      const ta = currTmp.details?.reduce( (ac, v) => ac += Number(v.amount), 0);
      const al = ta * (1-(lost/100));

      const wt_total = currTmp.details?.reduce( (a,v) => a += (Number(v.multiply || 0) * Number(v.amount || 0)) , 0);
      const wt_after_lost = wt_total * ( 1 - (lost/100) );

      currTmp.total = ta;
      currTmp.afterLost = al;
      currTmp.wt_after_lost = wt_after_lost;
       
      // if( !!tmpState[i + 1] ){
      //   let nextTmp = {...tmpState[i + 1]};
      //   nextTmp = {
      //     ...nextTmp,
      //     details : nextTmp.details?.map( (m, i) => {
      //       return { ...m, amount: i === 0 ? al : m.amount }
      //     }) || []
      //   } 
      //   tmpState[i + 1] = {...nextTmp};
      // } 

      tmpState[i - 0] = {...currTmp};
  }

  return tmpState;
} 

const addjustPercent = ( state ) => {
  const tmpState = [...state];
  const uStateLength = tmpState.length - 1; 
 
  for( let i = 0; i <= uStateLength; i++){ 
      let currTmp = {...tmpState[i]};  
      const cd = [...currTmp.details]; 
      // console.log(cd, currTmp);
      currTmp = {
        ...currTmp,
        details: cd.map( ( m, ind ) => {
          
          const percent = ((m.amount / currTmp?.total) || 0);
          const cost = ( ( Number(m.amount || 0) / (Number(m.yield || 100)/100) )/currTmp?.wt_after_lost) * Number(m.price || 0);
          return ({ ...m, percent, cost})
        })
      }  
      const cost_total = currTmp.details?.reduce( (a,v) => a += parseFloat( Number(v.cost || 0).toFixed(2) ) , 0);
      const cost_after_lost = cost_total / (1-(currTmp.lost/100));
      currTmp.cost_total = cost_total;
      currTmp.cost_after_lost = cost_after_lost;

      tmpState[i - 0] = {...currTmp};
  } 
  return tmpState; 
}

const addjustPercentTotal = ( state ) =>{
  const tmpState = state;
  const uStateLength = tmpState.length - 1;
 
  for( let i = 0; i <= uStateLength; i++){ 
      let currTmp = {...tmpState[i]};  
      const cd = [...currTmp.details]; 
      const cost_total = cd?.reduce( (a,v) => a += parseFloat( Number(v.cost || 0).toFixed(2) ) , 0);
      const cost_after_lost = cost_total / (1-(currTmp.lost/100));
      
      
      currTmp = {
        ...currTmp,
        cost_total: cost_total,
        cost_after_lost: cost_after_lost,
        details: cd.map( ( m, ind ) => { 
          const nextPercent = (!!tmpState[i+1] ? tmpState[i+1].details[0]?.percent || 1 : m.percent);
          const total_percent = (() => {
            if( i === uStateLength && ind === 0 && i > 0 ) return null;
            else if( i === uStateLength ) return Number(m?.percent || 0);
            else return Number(m?.percent || 0) * nextPercent;
          })(); 

          // const price = (ind === 0 && i > 0) ? cost_after_lost : Number(m?.percent || 0);
          //const cost = ( ( Number(m.amount || 0) / (Number(m.yield || 100)/100) )/currTmp?.wt_after_lost) * Number(m?.percent || 0);
 
          return { ...m, totalpercent: total_percent };
        })
      }
      tmpState[i - 0] = {...currTmp}; 

      if( !!tmpState[i + 1] ){
        let nextTmp = {...tmpState[i + 1]};
        const next_wt_total = nextTmp.details?.reduce( (a,v) => a += (Number(v.multiply || 0) * Number(v.amount || 0)) , 0);
        const next_wt_after_lost = next_wt_total / ( 1 - (nextTmp.lost/100) );        
        // const next_cost_total = nextTmp.details?.reduce( (a,v) => a += Number(v.cost || 0) , 0);
        // const next_cost_after_lost = cost_total / (1-(nextTmp.lost/100));
        nextTmp = {
          ...nextTmp,
          details : nextTmp.details?.map( (m, ind) => {
            const next_price = (ind === 0) ? cost_after_lost : Number(m?.price || 0); 
            const next_cost = ( ( Number(m.amount || 0) / (Number(m.yield || 0)/100) ) / next_wt_after_lost) * next_price;

            return { ...m, price: next_price,  cost : next_cost }
          }) || []
        } 

        tmpState[i + 1] = {...nextTmp}; 
      } 
  }
  
  return tmpState;
}

export const setValueAsync = createAsyncThunk(
  "sample-request-data/setValueAsync",
  async ( value ) => {
    const job = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (value >= 0) {
          resolve(value);
        } else {
          reject(Error(""));
        }
      }, 1000);
    });

    return await job;
  }
);

const samplePreparationSlice = createSlice({
  name: "sample-preparation-data",
  initialState: initialValues,
  reducers: {
    reset: () => initialValues,
    added: (state, action) => {
      const lastStep = state[state.length - 1];
      const cost_total = lastStep.details?.reduce( (a,v) => a += Number(v.cost || 0) , 0);
      const cost_after_lost = cost_total / (1-(lastStep.lost/100));
      state.push(
        {
          total: lastStep.total,
          lost: 0,
          afterLost: lastStep.afterLost,
          wt_after_lost: lastStep.wt_after_lost,
          cost_total: cost_total,
          cost_after_lost: cost_after_lost,
          details:[
            { 
              id:"1",
              stcode: "",
              stname: `paste from step ${state.length}`, 
              amount: Number( lastStep.afterLost.toFixed(2) ),
              percent:(lastStep.total / lastStep.total || 0),
              stepno: state.length + 1,
              multiply: 1,
              weight_in: 1 * Number( lastStep.afterLost.toFixed(2) ),
              yield: 100,
              price: cost_after_lost,
              cost: ((cost_total/100) / lastStep.wt_after_lost) * cost_after_lost,              
            }            
          ],
          loading: false,
        }
      ); 
      let jus__01 = addjustAfterLost(state);  
      let jus__02 = addjustPercent(jus__01);
      let jus__03 = addjustPercentTotal(jus__02);

      jus__03.forEach( (element, ind) => {
          state[ind].total = element.total;
          state[ind].lost = element.lost;
          state[ind].afterLost = element.afterLost;
          state[ind].wt_after_lost = element.wt_after_lost;
          state[ind].cost_total = element.cost_total;
          state[ind].cost_after_lost = element.cost_after_lost;          
          state[ind].loading = element.loading;

          state[ind].details = [...element.details];
      });
    },
    deleted:(state, action) => {
      const { index } = action.payload;

      state.splice( index, 1);
      let jus__01 = addjustAfterLost(state);  
      let jus__02 = addjustPercent(jus__01);
      let jus__03 = addjustPercentTotal(jus__02);

      jus__03.forEach( (element, ind) => {
          state[ind].total = element.total;
          state[ind].lost = element.lost;
          state[ind].afterLost = element.afterLost;
          state[ind].wt_after_lost = element.wt_after_lost;
          state[ind].cost_total = element.cost_total;
          state[ind].cost_after_lost = element.cost_after_lost;          
          state[ind].loading = element.loading;

          state[ind].details = [...element.details];
      });
    },
    updateDetailWithIndex:(state, action) => {
      const { index, detail } = action.payload;

      state[index].details = [...detail]; 
    },    
    addItemsDetail: (state, action) => { 
        const {index, detail, lost} = action.payload;
        
        const total_amount = detail.reduce( (acc, val) => acc += Number(val.amount) , 0); 
        const tmp = detail.map( elm => { 
            // console.log(elm);
            //elm.id = ind++
            return {
              ...elm,
              percent: (Number(elm.amount) / total_amount || 0) * 100,
              weight_in:  (Number(elm.amount) * Number(elm.multiply)),
              stepno: index + 1,
            }
        });  
 
        //detail = [...tmp];
        //const afterLost = total_amount * (1-(lost/100));  
        state[index].details = [...tmp];  
        state[index].total = total_amount;
        state[index].lost = Number(lost);
        // state[index].afterLost = afterLost;
 
        let jus__01 = addjustAfterLost(state);  
        let jus__02 = addjustPercent(jus__01);
        let jus__03 = addjustPercentTotal(jus__02);
        
        jus__03.forEach( (element, ind) => {
            state[ind].total = element.total;
            state[ind].lost = element.lost;
            state[ind].afterLost = element.afterLost;
            state[ind].wt_after_lost = element.wt_after_lost;
            state[ind].cost_total = element.cost_total;
            state[ind].cost_after_lost = element.cost_after_lost; 
            state[ind].loading = element.loading;
  
            state[ind].details = [...element.details];
        }); 
    },
    setValue: (state, action) => {
      const { detail } = action.payload; 
      const step = [...new Set(detail?.map( m => m.stepno))]; 
      let value = []; 
      let cost_total = 0;
      let cost_total_after_lost = 0;
      for( let i in step){
        const s = step[i];
        const v = detail.filter( f => f.stepno === s );
        const wt_total = v.reduce( (a,v) => a += (Number(v.multiply || 1) * Number(v.amount || 0)) , 0);
        const wt_after_lost = wt_total * (1 - (Number(v[0].lost || 0)/100));
        const tcount_af = cost_total_after_lost;

        if( v.length > 0 ){
          value.push(
            {
              total: Number(v[0].amount_total || 0),
              wt_total: wt_total,
              lost: Number(v[0].lost || 0),
              afterLost: Number(v[0].amount_after_lost || 0),
              wt_after_lost: wt_after_lost,
              details:v.map( (m, id) =>{ 
                  const precost = (id === 0 && i > 0) ? (tcount_af || 0) : Number(m.price || 0);
                  const pretotal_percent = (id === 0 && i > 0) ? null : Number(m.totalpercent || 0);
                  return {
                    id: (id+1),
                    stcode: m.stcode,
                    stname: !m.stname ? `paste from step ${id}` : m.stname, 
                    amount: Number(m.amount || 0),
                    percent: Number(m.percent || 0),
                    totalpercent: pretotal_percent,
                    stepno: m.stepno,
                    method: m.method,
                    weight_in: Number(m.multiply || 1) * Number(m.amount || 0),
                    multiply: Number(m.multiply || 1),
                    yield: Number(m.yield || 100),
                    price: precost,
                    cost: (( Number(m.amount || 0) / ( Number(m.yield || 100)/100 ) )/wt_after_lost) * precost,
                  }
                } 
              ), 
              loading: false,
              cost_total:0,
              cost_after_lost:0,
            }
          ); 
           
          cost_total = value[i]?.details.reduce( (acc, val) => acc += parseFloat( val.cost.toFixed(2) ), 0);
          cost_total_after_lost = cost_total / (1 - (Number(value[0].lost || 0)/100)); 
          value[i].cost_total = cost_total;
          value[i].cost_after_lost = cost_total_after_lost;
          
        } 
      }
      
      return value;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setValueAsync.fulfilled, (state, action) => {
      state.counter = action.payload;
      state.loading = false;
    });

    builder.addCase(setValueAsync.rejected, (state, action) => {
      state.counter = 0;
      state.loading = false;
    });

    builder.addCase(setValueAsync.pending, (state, action) => {
      state.loading = true;
    });
  },
});

export const { addItemsDetail, updateDetailWithIndex, reset, added, deleted, setValue} = samplePreparationSlice.actions;
export const samplePreparationSelector = (store) => store.samplePreparationSlice;
export default samplePreparationSlice.reducer;