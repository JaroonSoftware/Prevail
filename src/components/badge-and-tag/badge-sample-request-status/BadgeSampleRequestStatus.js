import React from 'react'
import {Badge} from "antd"

import { capitalized } from '../../../utils/util';

function BadgeSampleRequestStatus(props) {
    let status = 'processing';
    if( props.data === 'pending' ) status = 'processing'
    else if( props.data === 'complete' ) status = 'success'
    else status = 'error'

    return (
      <div>
        { <Badge status={status} text={capitalized(props.data || "")} /> }
      </div>
    )
} 

export default BadgeSampleRequestStatus
