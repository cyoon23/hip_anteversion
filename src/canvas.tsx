import { useEffect, useRef, useState } from 'react';
import steps from './constants/steps.json';
import { ellipse_parameters, measure_beta, measure_gamma, perp_line } from './Ellipse.tsx';
import {RangeStepInput} from 'react-range-step-input';
import { Button, ButtonGroup, ButtonOr, Grid, GridColumn, Input, Segment } from 'semantic-ui-react';

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
    const [dir, setDir] = useState([]);
    const [dirIndex, setDirIndex] = useState(-1);
    const [coordinatesMap, updateCoordinates] = useState(steps);
    const [scale, saveScale] = useState(0);
    const [activeItem, setActiveItem] = useState(0);
    const [gamma, measureGamma] = useState(0);
    const [beta, measureBeta] = useState(0);
    const [ratio, measureRatio] = useState(0);
    const [lineWidth, setLineWidth] = useState(2);
    const [buttonColor, setColor] = useState('red');
    const [id, setId] = useState('');
    const [listValues, setValues] = useState([] as {}[]);
    const [listCoorValues, setCoorValues] = useState([] as {}[]);
    const [laterality, setLaterality] = useState("");
    let fileInputRef;

  // draw effect – each time isDrawing,
  // start or end change, automatically
  // redraw everything
  useEffect(() => {
    restoreImage(activeItem);
  }, [buttonColor, lineWidth, coordinatesMap, activeItem]);

  useEffect(() => {
    if (activeItem === 5) {
      const newData = jsonData(),
        coorData = coorJsonData();
      setValues(
        listValues.filter(
        val => 'ID' in val && val.ID === id).length > 0 ? 
          listValues.map(
            (val => 'ID' in val && val.ID === id ? newData : val)
          ) : [...listValues, newData]
        );
      setCoorValues(
        listCoorValues.filter(
          val => 'ID' in val && val.ID === id).length > 0 ? 
            listCoorValues.map(
              (val => 'ID' in val && val.ID === id ? coorData : val)
            ) : [...listCoorValues, coorData]
      );
  }
  }, [gamma, beta, ratio])

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
          ctx.arc(currNode.coor[0].x, currNode.coor[0].y, lineWidth, 0, 2 * Math.PI);
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
    if (event.target.files && event.target.files.length) {
      setDir(event.target.files);
      setDirIndex(0);
      onSetImage(event.target.files, 0);
      setLaterality('');
    }
  };
  
  const onSetImage = (files, idx) => {
    let img = files[idx];
    const url = URL.createObjectURL(img);
    setFile(url);
    drawImage(url);
    onClearAllClick();
    setId(img.name.split('.')[0]);
    if (idx > 0) setDirIndex(idx);
    setLaterality('');
  }

  const onTextChange = (e) => {
    setId(e.target.value);
  }
    
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
      decimals = 2,
      jsonData = {
        "ID": id,
        "Abduction Angle": gamma.toFixed(decimals),
        "S/TL Ratio": ratio.toFixed(decimals),
        "Anteversion Angle (Widmer)": ant.toFixed(decimals),
        "Anteversion Angle (Liaw)": beta.toFixed(decimals),
        "Laterality": laterality
      };
    return jsonData;
  }

  const coorJsonData = () => {
    const data = jsonData(),
      coorList = [
        "Teardrop Coordinates", 
        "Acetabulum Diameter Coordinates", 
        "Acetabular Cup Perimeter Point", 
        "Acetabulum Head Perimeter Point"
      ];
    coorList.map((key, i) => {
      const coor = Object.values(coordinatesMap)[i+1].coor as Coordinate[];
      data[key] = '"[' + coor.map(val => [val.x.toFixed(2), val.y.toFixed(2)]).toString() + ']"';
    })
    return data;
  }

  const exportCsv = (filename, exportAll = false, text = false) => {
    const json = convertToCSV(exportAll ? listValues : [jsonData()]);
    downloadCsv(filename, json, text);
    
  }

  const exportCoor = (filename, text = false) => {
    const json = convertToCSV(listCoorValues);
    downloadCsv(filename, json, text);
  }

  const onPrevClick = () => {
    const prevItem = activeItem - 1;
    setActiveItem(prevItem);
    updateCoordinates({
      ...coordinatesMap,
      [prevItem.toString()]: {
        ...coordinatesMap[prevItem.toString()],
        coor: []
      }
    });
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

  const onLateralityClick = (e) => {
    if (laterality !== e.target.value) setLaterality(e.target.value);
    else setLaterality('');
  }
  
  const firstElementStr = listValues.length ? listValues[0]['ID'] : 'currData',
    firstThroughLastElementStr = listValues.length ? firstElementStr + '-' + listValues[listValues.length - 1]['ID'] : 'allData',
    allDataWithCoorStr = listValues.length ? firstThroughLastElementStr + "+Coors" : 'allData+Coors';

  return <Segment basic padded='very'>
      <Grid>
        <Grid.Row columns={2} verticalAlign='middle'>
        <Grid.Column floated='left'> 
          <Button
            content="Choose File(s)"
            labelPosition="left"
            icon="file"
            onClick={() => fileInputRef.click()}
            style={{ marginRight: "10px"}}
          />
          <input
            id="inputFile"
            type="file"
            hidden
            ref={refParam => fileInputRef = refParam}
            onChange={onImageChange} 
            multiple 
          />
          Image ID: <Input 
                        placeholder="Image ID" 
                        value={id} 
                        onChange={onTextChange}
                      />
          { activeItem > 0 ? 
          <ButtonGroup style={{ marginLeft: "20px"}}>
          <Button 
            onClick={onLateralityClick}
            value="Right"
            color={laterality === "Right" ? 'twitter' : undefined}
          >
            Right
          </Button>
          <ButtonOr /> 
          <Button 
            onClick={onLateralityClick}
            value="Left"
            color={laterality === "Left" ? 'twitter' : undefined}
          >
            Left
          </Button>
        </ButtonGroup>
          : ''}
        </Grid.Column>
        <Grid.Column floated='right'> 
        { activeItem > 0 ?
          <Grid.Column style={{display: 'flex', flexDirection: 'row'}}> 
          <div style={{marginRight: '50px'}}> {dir.length > 1 ? 
              ' Image ' + (dirIndex+1).toString() + ' of ' +  (dir.length).toString() + '' : ''}
            </div>
            Line width: 
            <RangeStepInput 
              min={0.5} 
              max={5} 
              value={lineWidth} 
              step={0.1} 
              onChange={onLineWidthChange} 
              style={{marginLeft: '10px', marginRight: '20px'}} 
            /> 
        {['red', 'blue', 'green', 'purple'].map(color => 
          <Button 
            circular
            key={color}
            color={color}
            onClick={onColorButtonClick}
            value={color}
          />
            )} 
        </Grid.Column>
             : '' }
        </Grid.Column>
        </Grid.Row>
      </Grid>
      <Segment basic>
        <h2> { activeItem > 0 ? `Step ${activeItem}: ${steps[activeItem.toString()].text}` : '' } </h2>
        <div> { activeItem > 0 ? `${steps[activeItem.toString()].supp}` : '' } </div>
      </Segment>
      { <canvas ref={canvasRef} height={activeItem > 0 ? window.innerHeight : 0} width={activeItem > 0 ? window.innerWidth : 0} onClick={handleClick} /> }
      <Segment basic>
        { activeItem > 1 ? <Button onClick={onPrevClick}> Back </Button> : '' }
        { activeItem < Object.keys(steps).length - 1 && activeItem > 0 ? <Button onClick={onNextClick}> Next </Button> : '' }
        { activeItem > 0 ? <Button onClick={onUndoClick}> Undo </Button> : '' }
        {activeItem > 0 ? <Button onClick={onClearClick}> Clear </Button> : '' }
        { activeItem > 0 ? <Button onClick={onClearAllClick}> Clear All </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 ? <Button onClick={() => exportCsv(firstElementStr, false, true)}> Download text </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 ? <Button onClick={() => exportCsv(firstElementStr)}> Download CSV </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 ? <Button onClick={() => exportCsv(firstThroughLastElementStr, true, true)}> Download all text </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 ? <Button onClick={() => exportCsv(firstThroughLastElementStr, true)}> Download all CSV </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 ? <Button onClick={() => exportCoor(allDataWithCoorStr, true)}> All with coor text </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 ? <Button onClick={() => exportCoor(allDataWithCoorStr, false)}> All with coor CSV </Button> : '' }
        { activeItem === Object.keys(steps).length - 1 && dir.length - 1 > dirIndex ? <Button onClick={() => {onSetImage(dir, dirIndex + 1)}}> Next Image in Directory </Button> : '' }
      </Segment>
      </Segment>;
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};

export default Canvas;

