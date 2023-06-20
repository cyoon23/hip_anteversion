import React, { useEffect, useRef, useState } from 'react';
import steps from './constants/steps.json';
import { ellipse_parameters, measure_beta, measure_gamma, perp_line } from './Ellipse.tsx';


interface CanvasProps {
    width: number;
    height: number;
}

export type Coordinate = {
    x: number | null;
    y: number | null;
};

const Canvas = ({ width, height }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [file, setFile] = useState('');
    const [fileWidth, setWidth] = useState(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [start, setStart] = useState({x: null, y: null});
    const [end, setEnd] = useState({x: null, y: null});
    const [coordinatesMap, updateCoordinates] = useState(steps);
    const [scale, saveScale] = useState(0);
    const [activeItem, setActiveItem] = useState(0);
    const [gamma, measureGamma] = useState(0);
    const [beta, measureBeta] = useState(0);
    const [ratio, measureRatio] = useState(0);

  // draw effect – each time isDrawing,
  // start or end change, automatically
  // redraw everything
  useEffect(() => {
    restoreImage(activeItem);
  }, [isDrawing, start, end]);

  const restoreImage = (endIndex) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const i = new Image();
    i.src = file;
    i.onload = () => {
      ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale);
      setWidth(i.width*scale);
      for (let idx=1; idx <= endIndex; idx++) {
        const currNode = coordinatesMap[idx.toString()];
        if (currNode.type === 'line' && currNode.coor.length === 1) {
          // Fill out dot
          ctx.fillStyle = 'red';
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
          scale = scale1 > scale2 ? scale1 : scale2;
        saveScale(scale);
        context.drawImage(i, 0, 0, i.width*scale, i.height*scale );
        context.strokeStyle = 'red';
        context.lineJoin = 'round';
        context.lineWidth = 5;
    }
  }

  const onImageChange = event => {
      if (event.target.files && event.target.files[0] && !file.length) {
        let img = event.target.files[0];
        const url = URL.createObjectURL(img);
        setFile(url);
        drawImage(url);
        setActiveItem(1);
      }
    };
    
  const handleClick = (e) => {
    if (!coordinatesMap[activeItem.toString()].coor.length) {
      const startCoor = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      };
      setStart(startCoor);
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
      setEnd(endCoor)
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

  const csvFormat = (dict) => {
    return [Object.keys(dict).join(','), Object.values(dict).join(',')].join('\n');
  }

  const exportCsv = (filename) => {
    const ant = 48.05*ratio-0.3,
      jsonData = {
      "Abduction Angle": gamma,
      "S/L": ratio,
      "Anteversion (Widmer)": ant,
      "Anteversion (Liaw)": beta,
    },
    json = csvFormat(jsonData),
    blob = new Blob([json], { type: 'text/csv' }),
    url = window.URL.createObjectURL(blob),
    a = document.createElement('a');
    a.setAttribute('href', url);
    a.download = filename;
    a.click();
  }

  const onPrevClick = (e) => {
    setActiveItem(activeItem - 1);
  }

  const onNextClick = (e) => {
    setActiveItem(activeItem + 1);
  }

  const onClearClick = (e) => {
    updateCoordinates({
      ...coordinatesMap,
      [activeItem.toString()]: {
        ...coordinatesMap[activeItem.toString()],
        coor: []
      }
    });
    restoreImage(activeItem);
  }

  const onClearAllClick = (e) => {
    updateCoordinates(steps);
    setActiveItem(1);
    restoreImage(activeItem);
  }

  const onUndoClick = (e) => {
    let currActive = activeItem;
    if (!coordinatesMap[activeItem.toString()].coor.length) {
      setActiveItem(activeItem - 1);
      currActive -= 1;
      setEnd({x: null, y: null});
    }
    else setStart({x: null, y: null});
    updateCoordinates({
      ...coordinatesMap,
      [currActive.toString()]: {
        ...coordinatesMap[currActive.toString()],
        coor: coordinatesMap[currActive.toString()].coor.slice(0, -1)
      }
    });
    restoreImage(currActive);
  }

  return <>
      <input type="file" onChange={onImageChange} />
      <h2> { activeItem > 0 ? `Step ${activeItem}: ${steps[activeItem.toString()].text}` : '' } </h2>
      <div> { activeItem > 0 ? `${steps[activeItem.toString()].supp}` : '' } </div>
      <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} onClick={handleClick} />
      { activeItem > 1 ? <button onClick={onPrevClick}> Back </button> : '' }
      { activeItem < Object.keys(steps).length - 1 ? <button onClick={onNextClick}> Next </button> : '' }
      { <button onClick={onUndoClick}> Undo </button> }
      { <button onClick={onClearClick}> Clear </button> }
      { <button onClick={onClearAllClick}> Clear All </button> }
      { activeItem === Object.keys(steps).length - 1 ? <button onClick={() => exportData('text')}> Download text </button> : '' }
      { activeItem === Object.keys(steps).length - 1 ? <button onClick={() => exportCsv('text')}> Download CSV </button> : '' }
  </>;
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;

