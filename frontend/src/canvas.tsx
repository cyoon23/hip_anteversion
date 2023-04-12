import React, { useEffect, useRef, useState } from 'react';

interface CanvasProps {
    width: number;
    height: number;
}

type Coordinate = {
    x: number;
    y: number;
};

const Canvas = ({ width, height }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [file, setFile] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [start, setStart] = useState({x: 0, y: 0});
    const [end, setEnd] = useState({x: 0, y: 0});
    const [startBool, setStartBool] = useState(false);
    const [endBool, setEndBool] = useState(false);
    const [coordinateList, updateCoordinateList] = useState<[Coordinate, Coordinate][]>([]);
    const [currStep, saveStep] = useState(-1);
    const [scale, saveScale] = useState(0);

    // draw effect – each time isDrawing,
  // start or end change, automatically
  // redraw everything
  useEffect(() => {
    restoreImage(currStep);
  }, [isDrawing, start, end]);

  const restoreImage = (endIndex) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const i = new Image();
    i.src = file;
    i.onload = () => {
      ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale);
      for (let i=0; i <= endIndex; i++) {
        if (i === currStep && !endBool) {
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(start.x, start.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        else { 
          const [startCoor, endCoor] = coordinateList[i];
          // draw the line
          ctx.beginPath();
          ctx.moveTo(startCoor.x, startCoor.y);
          ctx.lineTo(endCoor.x, endCoor.y);
          ctx.closePath();
          ctx.stroke();
        }
        if (i === currStep && startBool && endBool) {
          setStartBool(false);
          setEndBool(false);
        }
      }
    }
  }

  // const undoImage = () => {
  //   if (!canvasRef.current) return;
  //   const ctx = canvasRef.current.getContext('2d');
  //   if (!ctx) return;
  //   if (currStep > 0) {
  //     saveStep(currStep - 1);
  //     const i = new Image();
  //     i.src = canvasArr[currStep];
  //     i.onload = () =>
  //       ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale );
  //   }
  // }

  // const redoImage = () => {
  //   if (!canvasRef.current) return;
  //   const ctx = canvasRef.current.getContext('2d');
  //   if (!ctx) return;
  //   if (currStep < canvasArr.length - 1) {
  //     saveStep(currStep + 1);
  //     const i = new Image();
  //     i.src = canvasArr[currStep];
  //     i.onload = () =>
  //       ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale );
  //   }
  // }

    const drawImage = (url) => {
      const canvas = canvasRef.current;
      if (!canvas) return; 
      const context = canvas.getContext('2d'); 
      if (!context) return; 
      const i = new Image();
      i.src = url;
      i.onload = () => { 
          const scale1 = window.innerWidth/i.width;
          const scale2 = window.innerHeight/i.height;
          const scale = scale1 > scale2 ? scale1 : scale2;
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
        }
      };
    
    const handleClick = (e) => {
      if (!startBool) {
        const startCoor = {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY
        };
        setStart(startCoor);
        setStartBool(true);
        saveStep(currStep + 1);
      }
      else if (startBool && !endBool) {
        const endCoor = {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY
        };
        setEnd(endCoor)
        updateCoordinateList([...coordinateList, [start, endCoor]]);
        setEndBool(true);
      }
    }

    return <>
        <input type="file" onChange={onImageChange} />
        <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} onClick={handleClick}
        />
    </>;
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;
