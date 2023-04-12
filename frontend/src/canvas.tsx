import React, { useCallback, useEffect, useRef, useState } from 'react';

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
    if (startBool && endBool) {
      const currCoor = [start, end] as [Coordinate, Coordinate];
      updateCoordinateList([...coordinateList, currCoor]);
  }
    // restoreImage(coordinateList.length - 1);
    if (!canvasRef.current) return;

    // clear canvasRef
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const i = new Image();
    i.src = file;
    i.onload = () => {
      ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale );

      // if only start
      if (startBool && !endBool) {
        ctx.fillRect(start.x, start.y, 1, 1);
      }
      else if (startBool && endBool) {
        // draw the line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
        setStartBool(false);
        setEndBool(false);
      }
    }
  }, [isDrawing, start, end]);

  function mousedown(e) {
    setIsDrawing(true);
    setStart({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    });
    setEnd({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    });
  }
  function mousemove(e) {
    if (!isDrawing) return;
    setEnd({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    });
  }
  function mouseup(e) {
    setIsDrawing(false);
  }

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

  const restoreImage = (endIndex) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const i = new Image();
    i.src = file;
    i.onload = () => {
      ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale);
      for (let i=0; i<=endIndex; i++) {
        const [start, end] = coordinateList[i];
        // draw the line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
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
        setStart({
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY
        });
        setStartBool(true);
      }
      else if (startBool && !endBool) {
        setEnd({
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY
        })
        setEndBool(true);
      }
    }

    return <>
        <input type="file" onChange={onImageChange} />
        <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} 
        // onMouseDown={mousedown}
        // onMouseMove={mousemove}
        // onMouseUp={mouseup} 
        onClick={handleClick}
        />
    </>;
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;
