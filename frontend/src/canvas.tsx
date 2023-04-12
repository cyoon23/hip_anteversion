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
    // const [isPainting, setIsPainting] = useState(false);
    // const [mousePosition, setMousePosition] = useState<Coordinate | undefined>(undefined);
    const [file, setFile] = useState('');
    // const [coordinateList, updateCoordinateList] = useState<[Coordinate, Coordinate][]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [end, setEnd] = useState({ x: 0, y: 0 });
    const [defaultContext, setDefault] = useState<CanvasRenderingContext2D>();

    // const startPaint = useCallback((event: MouseEvent) => {
    //     const coordinates = getCoordinates(event);
    //     if (coordinates) {
    //         setMousePosition(coordinates);
    //         setIsPainting(true);
    //         updateCoordinateList([[coordinates, coordinates], ...coordinateList]);
    //     }
    // }, []);

    // useEffect(() => {
    //     if (!canvasRef.current) {
    //         return;
    //     }
    //     const canvas: HTMLCanvasElement = canvasRef.current;
    //     canvas.addEventListener('mousedown', startPaint);
    //     return () => {
    //         canvas.removeEventListener('mousedown', startPaint);
    //     };
    // }, [startPaint]);

    // const paint = useCallback(
    //     (event: MouseEvent) => {
    //         if (isPainting) {
    //             const newMousePosition = getCoordinates(event);
    //             if (mousePosition && newMousePosition && coordinateList.length) {
    //                 // drawLine(mousePosition, newMousePosition);
    //                 drawLine(coordinateList[0][0], newMousePosition);
    //                 setMousePosition(newMousePosition);
    //                 const i = coordinateList.length - 1;
    //                 let newList = coordinateList;
    //                 newList[i][1] = newMousePosition;
    //                 updateCoordinateList(newList);
    //             }
    //         }
    //     },
    //     [isPainting, mousePosition]
    // );

    // useEffect(() => {
    //     if (!canvasRef.current) {
    //         return;
    //     }
    //     const canvas: HTMLCanvasElement = canvasRef.current;
    //     canvas.addEventListener('mousemove', paint);
    //     return () => {
    //         canvas.removeEventListener('mousemove', paint);
    //     };
    // }, [paint]);

    // const exitPaint = useCallback(() => {
    //     setIsPainting(false);
    //     setMousePosition(undefined);
    // }, []);

    // useEffect(() => {
    //     if (!canvasRef.current) {
    //         return;
    //     }
    //     const canvas: HTMLCanvasElement = canvasRef.current;
    //     canvas.addEventListener('mouseup', exitPaint);
    //     canvas.addEventListener('mouseleave', exitPaint);
    //     return () => {
    //         canvas.removeEventListener('mouseup', exitPaint);
    //         canvas.removeEventListener('mouseleave', exitPaint);
    //     };
    // }, [exitPaint]);

    // const getCoordinates = (event: MouseEvent): Coordinate | undefined => {
    //     if (!canvasRef.current) {
    //         return;
    //     }

    //     const canvas: HTMLCanvasElement = canvasRef.current;
    //     return { x: event.pageX - canvas.offsetLeft, y: event.pageY - canvas.offsetTop };
    // };

    // const drawLine = (originalMousePosition: Coordinate, newMousePosition: Coordinate) => {
    //     if (!canvasRef.current) {
    //         return;
    //     }
    //     const canvas: HTMLCanvasElement = canvasRef.current;
    //     const context = canvas.getContext('2d');
    //     if (context) {
    //         context.strokeStyle = 'red';
    //         context.lineJoin = 'round';
    //         context.lineWidth = 5;

    //         context.beginPath();
    //         context.moveTo(originalMousePosition.x, originalMousePosition.y);
    //         context.lineTo(newMousePosition.x, newMousePosition.y);
    //         context.closePath();

    //         context.stroke();
    //     }
    // };

    // draw effect – each time isDrawing,
  // start or end change, automatically
  // redraw everything
  useEffect(() => {
    if (!canvasRef.current) return;

    // clear canvasRef
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const i = new Image();
    i.src = file;
    i.onload = () => {
      const scale1 = window.innerWidth/i.width;
      const scale2 = window.innerHeight/i.height;
      const scale = scale1 > scale2 ? scale1 : scale2;
      ctx.drawImage(i, 0, 0, i.width*scale, i.height*scale );

      // draw the line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.closePath();
      ctx.stroke();
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
            context.drawImage(i, 0, 0, i.width*scale, i.height*scale );
            context.strokeStyle = 'red';
            context.lineJoin = 'round';
            context.lineWidth = 5;
            setFile(url);
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

    return <>
        <input type="file" onChange={onImageChange} />
        <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} onMouseDown={mousedown}
        onMouseMove={mousemove}
        onMouseUp={mouseup} />
    </>;
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;
