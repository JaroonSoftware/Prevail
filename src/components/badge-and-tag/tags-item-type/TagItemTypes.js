import React from 'react'
import {Tag} from "antd"

import { capitalized } from '../../../utils/util';

function TagItemTypes(props) {
    let value = 'green';
    if( props.data === 'Finish Goods' ) value = 'green'
    else if( props.data === 'Sample' ) value = 'geekblue'
    else if( props.data === 'Material' ) value = 'red'
    else if( props.data === 'Package' ) value = 'purple'
    else if( props.data === 'Packaging' ) value = 'orange'
    else value = 'volcano'

    return (
      <div>
        { <Tag color={value} >{capitalized(props.data || "")}</Tag> }
      </div>
    )
} 

export default TagItemTypes
