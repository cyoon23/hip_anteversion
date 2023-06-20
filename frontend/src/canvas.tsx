import { useEffect, useRef, useState } from 'react';
import steps from './constants/steps.json';
import { ellipse_parameters, measure_beta, measure_gamma, perp_line } from './Ellipse.tsx';
import {RangeStepInput} from 'react-range-step-input';

interface CanvasProps {
    width: number;
    height: number;
}

export type Coordinate = {
    x: number;
    y: number;
};

const Canvas = ({ width, height }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [file, setFile] = useState('');
    const [fileWidth, setWidth] = useState(0);
    const [coordinatesMap, updateCoordinates] = useState(steps);
    const [scale, saveScale] = useState(0);
    const [activeItem, setActiveItem] = useState(0);
    const [gamma, measureGamma] = useState(0);
    const [beta, measureBeta] = useState(0);
    const [ratio, measureRatio] = useState(0);
    const [lineWidth, setLineWidth] = useState(5);
    const [buttonColor, setColor] = useState('red');
    const [listValues, setValues] = useState([] as {}[]);

  // draw effect – each time isDrawing,
  // start or end change, automatically
  // redraw everything
  useEffect(() => {
    restoreImage(activeItem);
  }, [buttonColor, lineWidth, coordinatesMap, activeItem]);

  const restoreImage = (endIndex) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const i = new Image();
    i.src = file;
    i.onload = () => {
      ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale);
      ctx.strokeStyle = buttonColor;
      setWidth(i.width*scale);
      for (let idx=1; idx <= endIndex; idx++) {
        const currNode = coordinatesMap[idx.toString()];
        if (currNode.type === 'line' && currNode.coor.length === 1) {
          // Fill out dot
          ctx.fillStyle = buttonColor;
          ctx.beginPath();
          ctx.arc(currNode.coor[0].x, currNode.coor[0].y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        if (currNode.type === 'line' && currNode.coor.length === 2) {
          const [startCoor, endCoor] = extendLine(currNode.coor);
          // draw the line 
          ctx.beginPath();
          ctx.moveTo(startCoor.x, startCoor.y);
          ctx.lineTo(endCoor.x, endCoor.y);
          ctx.closePath();
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
        else if (currNode.type === 'ellipse' && 'parentNode' in currNode && [...currNode.coor, ...coordinatesMap[currNode.parentNode].coor].length === 3) {
          const diameter_coor = coordinatesMap[currNode.parentNode].coor;
          ctx.beginPath();
          ctx.ellipse(...ellipse_parameters(diameter_coor, currNode.coor[0]));
          ctx.closePath();
          ctx.stroke();
          if (idx.toString() === '4') {
            const [pt1, pt2] = perp_line(diameter_coor, currNode.coor[0]);
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.closePath();
            ctx.stroke();
            const gamma = measure_gamma([...coordinatesMap['1'].coor, ...diameter_coor]);
            measureGamma(gamma);
            const [beta, ratio] = measure_beta(diameter_coor, coordinatesMap['3'].coor[0], pt2, gamma);
            measureBeta(beta);
            measureRatio(ratio);
          }
        }
      }
    }
  }

  const extendLine = (coor) => {
    const [startCoor, endCoor] = coor,
      m = (endCoor.y - startCoor.y)/(endCoor.x - startCoor.x),
      y1 = m * (0 - startCoor.x) + startCoor.y,
      y2 = m * (fileWidth - startCoor.x) + startCoor.y;
    return [{x: 0, y: y1}, {x: fileWidth, y: y2}];


  }

  const drawImage = (url) => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    const context = canvas.getContext('2d'); 
    if (!context) return;
    const i = new Image();
    i.src = url;
    i.onload = () => { 
        const scale1 = window.innerWidth/i.width,
          scale2 = window.innerHeight/i.height,
          scale = scale1 > scale2 ? scale2 : scale1;
        saveScale(scale);
        canvas.width = i.width*scale;
        canvas.height = i.height*scale;
        context.drawImage(i, 0, 0, i.width*scale, i.height*scale );
        context.strokeStyle = buttonColor;
        context.lineJoin = 'round';
        context.lineWidth = lineWidth;
    }
  }

  const onImageChange = event => {
      if (event.target.files && event.target.files[0]) {
        let img = event.target.files[0];
        const url = URL.createObjectURL(img);
        setFile(url);
        drawImage(url);
       onClearAllClick();
      }
    };
    
  const handleClick = (e) => {
    if (!coordinatesMap[activeItem.toString()].coor.length) {
      const startCoor = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      };
      updateCoordinates({
        ...coordinatesMap,
        [activeItem.toString()]: {
          ...coordinatesMap[activeItem.toString()],
          coor: [startCoor]
        }
      });
      if (coordinatesMap[activeItem.toString()].type === 'ellipse') setActiveItem(activeItem + 1);
    }
    else if (coordinatesMap[activeItem.toString()].type === 'line' && coordinatesMap[activeItem.toString()].coor.length === 1) {
      const endCoor = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      };
      updateCoordinates({
        ...coordinatesMap,
        [activeItem.toString()]: {
          ...coordinatesMap[activeItem.toString()],
          coor: [...coordinatesMap[activeItem.toString()].coor, endCoor]
        }
      });
      setActiveItem(activeItem + 1);
    }
  }

  const exportData = (fileName) => {
    const ant = 48.05*ratio-0.3,
      jsonData = {
      "Abduction Angle": gamma,
      "S/L": ratio,
      "Anteversion (Widmer)": ant,
      "Anteversion (Liaw)": beta,
    },
      json = JSON.stringify(jsonData),
      blob = new Blob([json], {type: "octet/stream"}),
      url = window.URL.createObjectURL(blob),
      a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
  }

  const convertToCSV = (arr) => {
    const array = [Object.keys(arr[0])].concat(arr);
    return array.map(item => {
      return Object.values(item).toString()
    }).join('\n')
  }

  const downloadCsv = (filename, json, text) => {
    const blob = new Blob([json], { type: text ? 'octet/stream' : 'text/csv' }),
    url = window.URL.createObjectURL(blob),
    a = document.createElement('a');
    a.setAttribute('href', url);
    a.download = filename;
    a.click();
  }

  const jsonData = () => {
    const ant = 48.05*ratio-0.3,
      jsonData = {
        "Abduction Angle": gamma,
        "S/L": ratio,
        "Anteversion (Widmer)": ant,
        "Anteversion (Liaw)": beta,
      };
    return jsonData;
  }

  const exportCsv = (filename, exportAll = false, text = false) => {
    const data = jsonData(),
    json = convertToCSV(exportAll ? [...listValues, data] : [data]);
    downloadCsv(filename, json, text);
  }

  const onPrevClick = () => {
    setActiveItem(activeItem - 1);
  }

  const onNextClick = () => {
    if ((coordinatesMap[activeItem.toString()].type === 'ellipse' && coordinatesMap[activeItem.toString()].coor.length === 1) || 
    (coordinatesMap[activeItem.toString()].type === 'line' && coordinatesMap[activeItem.toString()].coor.length === 2)) 
      setActiveItem(activeItem + 1);
  }

  const onClearClick = () => {
    updateCoordinates({
      ...coordinatesMap,
      [activeItem.toString()]: {
        ...coordinatesMap[activeItem.toString()],
        coor: []
      }
    });
  }

  const onClearAllClick = () => {
    updateCoordinates(steps);
    setActiveItem(1);
  }

  const onUndoClick = () => {
    let currActive = activeItem;
    if (!coordinatesMap[activeItem.toString()].coor.length) {
      setActiveItem(activeItem - 1);
      currActive -= 1;
    }
    updateCoordinates({
      ...coordinatesMap,
      [currActive.toString()]: {
        ...coordinatesMap[currActive.toString()],
        coor: coordinatesMap[currActive.toString()].coor.slice(0, -1)
      }
    });
  }

  const onLineWidthChange = (e) => {
    setLineWidth(e.target.value);
  }

  const onColorButtonClick = (e) => {
    setColor(e.target.value);
  }

  return <>
      <input type="file" onChange={onImageChange} />
      <h2> { activeItem > 0 ? `Step ${activeItem}: ${steps[activeItem.toString()].text}` : '' } </h2>
      <div> { activeItem > 0 ? `${steps[activeItem.toString()].supp}` : '' } </div>
      <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} onClick={handleClick} />
      { activeItem > 0 ? <div style={{display: 'flex', flexDirection: 'row'}}> 
      Scale line width: <RangeStepInput min={1} max={10} value={lineWidth} step={1} onChange={onLineWidthChange} />
      {['red', 'blue', 'green', 'purple'].map(color => 
        <button 
          key={color} 
          onClick={onColorButtonClick} 
          value={color} 
          style={{borderRadius: '50%', backgroundColor: color, border: 'none', padding: '8px', marginRight: '4px'}} />)}
      </div> : '' }
      <br></br>
      { activeItem > 1 ? <button onClick={onPrevClick}> Back </button> : '' }
      { activeItem < Object.keys(steps).length - 1 ? <button onClick={onNextClick}> Next </button> : '' }
      { <button onClick={onUndoClick}> Undo </button> }
      { <button onClick={onClearClick}> Clear </button> }
      { <button onClick={onClearAllClick}> Clear All </button> }
      { activeItem === Object.keys(steps).length - 1 ? <button onClick={() => exportCsv('textData', false, true)}> Download text </button> : '' }
      { activeItem === Object.keys(steps).length - 1 ? <button onClick={() => exportCsv('oneData')}> Download CSV </button> : '' }
      { activeItem === Object.keys(steps).length - 1 ? <button onClick={() => exportCsv('textAllData', true, true)}> Download all text </button> : '' }
      { activeItem === Object.keys(steps).length - 1 ? <button onClick={() => exportCsv('allData', true)}> Download all CSV </button> : '' }
  </>;
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;

