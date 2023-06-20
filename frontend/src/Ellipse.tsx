import { Coordinate } from "./canvas";

export const ellipse_parameters = (diameter_coor: [Coordinate, Coordinate], peripheral_pt: Coordinate): [number, number, number, number, number, number, number] => {
    const coordinates_list = [...diameter_coor, peripheral_pt];
    const midpt = midpoint(...diameter_coor);
    const angle = -1 * calc_angle(...diameter_coor);
    // Rotate each point of dots list 
    const new_coor = coordinates_list.map(v => rotate(midpt, v, angle));
    const major_axis_length = dist(...diameter_coor);
    const minor_axis_length = minor_axis(new_coor, midpt)*2;
    const axes: [number, number] = [~~major_axis_length/2, ~~minor_axis_length/2];
    const int_midpt: [number, number] = [~~midpt.x, ~~midpt.y];
    // Return the negative of the angle since ellipse is clockwise
    return [...int_midpt, ...axes, -1 * angle, 0, 360];
}

const midpoint = (v1: Coordinate, v2: Coordinate): Coordinate => {
    return {x: (v1.x+v2.x)/2, y: (v1.y+v2.y)/2}
}

const calc_angle = (v1: Coordinate, v2: Coordinate) => {
    /*
        Calculate angle between two points, if v1 is
        left of v2. Use tan of angle = opposite/adjacent.
    */
   const y = v2.y - v1.y;
   const x = v2.x - v1.x;
   return Math.atan(y/x);
}

export const rotate = (origin: Coordinate, point: Coordinate, angle: number) => {
    /*
        Rotate point CCW by a given angle around a given origin.
        The angle should be given in radians.
    */
   const qx = origin.x + Math.cos(angle) * (point.x - origin.x) - Math.sin(angle) * (point.y - origin.y);
   const qy = origin.y + Math.sin(angle) * (point.x - origin.x) + Math.cos(angle) * (point.y - origin.y);
   return {x: qx, y: qy};
}

const dist = (v1: Coordinate, v2: Coordinate) => {
    const a = v1.x - v2.x;
    const b = v1.y - v2.y;
    return Math.sqrt(a**2 + b**2);
}

const minor_axis = (dots_list, midpoint) => {
    /*
        For an ellipse aligned with the x-axis, solve for the
        length of its minor axis. The equation for an ellipse
        with center (h,k): (x-h)2/a2 + (y-k)2/b2 = 1
    */
    const x = dots_list[2].x;
    const y = dots_list[2].y;
    const h = midpoint.x;
    const k = midpoint.y;
    const a = Math.abs(h - dots_list[0].x);
    const num = (y - k)**2;
    const denom = 1 - (((x-h)**2)/(a**2));
    const b = (num/denom)**0.5;
    return b;
}

export const perp_line = (diameter_coor: [Coordinate, Coordinate], peripheral_pt: Coordinate) => {
    const coordinates_list = [...diameter_coor, peripheral_pt];
    const midpt = midpoint(...diameter_coor);
    const angle = -1 * calc_angle(...diameter_coor);
    // Rotate each point of dots list 
    let new_coor: Coordinate[] = [];
    for (let i=0; i<coordinates_list.length; i++) {
        new_coor.push(rotate(midpt, coordinates_list[i], angle));
    }
    const minor_axis_length = minor_axis(new_coor, midpt);
    return solve_for_peak_coors(midpt, minor_axis_length, -1 * angle);

}

const solve_for_peak_coors = (midpt, minor_axis_length, angle) => {
    const new_coor_plus = {x: midpt.x, y: midpt.y + minor_axis_length};
    const new_coor_minus = {x: midpt.x, y: midpt.y - minor_axis_length};
    return [rotate(midpt, new_coor_plus, angle), rotate(midpt, new_coor_minus, angle)];
}


const get_vec = (a, b) => {
    return [b.x-a.x, b.y-a.y];
}

const dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

export const measure_gamma = (coor_list: Coordinate[]) => {
    const v1 = get_vec(coor_list[0], coor_list[1]),
        v2 = get_vec(coor_list[2], coor_list[3]),
        dotp = dot(v1, v2),
        mag1 = dot(v1, v1)**0.5,
        mag2 = dot(v2, v2)**0.5;
    return Math.acos(dotp/mag2/mag1) * 180/Math.PI;
}

export const measure_beta = (diameter_coor: [Coordinate, Coordinate], peripheral_pt: Coordinate, pt2: Coordinate, gamma: number) => {
    const angle = -1 * calc_angle(...diameter_coor),
        midpt = midpoint(...diameter_coor),
        coors = [...diameter_coor, peripheral_pt].map(pt => rotate(midpt, pt, angle)),
        s = minor_axis(coors, midpt)*2,
        pt1 = rotate(midpt, {x: midpt.x, y: midpt.y + s/2}, -1*angle),
        t1 = dist(pt1, pt2),
        ratio = s/2/t1,
        csc = 1/Math.sin(gamma),
        isin = Math.asin(ratio/(2-ratio)),
        tan = Math.tan(isin*csc),
        alpha = Math.atan(tan),
        tan1 = Math.tan(alpha + 5.46*Math.PI/180),
        beta = Math.atan(tan1*Math.sin(gamma)) * 180/Math.PI;
        return [beta, ratio];
}

