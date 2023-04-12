import React from "react";

class Canvas extends React.Component {
  constructor() {
    super();
    this.state = {
      image: '',
      isLoaded: false,
    }
    this.ref = React.createRef();
  }

  onImageChange = event => {
    if (event.target.files && event.target.files[0] && !this.state.image.length) {
      let img = event.target.files[0];
      const url = URL.createObjectURL(img);
      const context = this.ref.current.getContext('2d');
      const i = new Image();
      i.src = url;
      i.onload = () => {
        const scale1 = window.innerWidth/i.width;
        const scale2 = window.innerHeight/i.height;
        const scale = scale1 > scale2 ? scale1 : scale2;
        context.drawImage(i, 0, 0, i.width*scale, i.height*scale );
        console.log(scale);
        console.log(i.width);
        console.log(i.height);
        this.setState({
          image: url,
        });
      };
    }
  };

  render() {
    const { innerWidth, innerHeight } = window;
    return (
      <>
        <input type="file" onChange={this.onImageChange} />
        <></>
        <canvas ref={this.ref} height={innerHeight} width={innerWidth} />
      </>
    )
  }
}

export default Canvas;