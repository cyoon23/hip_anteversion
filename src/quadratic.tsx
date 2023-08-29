export const quadraticFormula = (x0, y0, x1, y1) => {
    /*
        Vertex point: (x0, y0) = (h, k)
        Other point: (x1, y1)
        Using the vertex form of the quadratic formula horizontal: x = a(x-k)^2 + h
        a = coefficient for quadratic term
        b = coefficient for linear term
        c = constant term 
    */
   const a = (x1 - x0) / (y1 - y0)**2;
   const b = -2*a*y0;
   const c = a*y0**2 + x0;
   return {a: a, b: b, c: c};
};

export const controlPoint = (a, y0, x1, y1) => {
    /*
        Calculate control point for Bezier curve to match parabola.
    */
   const xp = 2*a*(y1-y0);
   const x = xp*(y0-y1)+x1;
   return {x: x, y: y0};
}

export const getDerivatives = (a, y0, y1) => {
    const xp = 2*a*(y1-y0);
    const xpp = 2*a;
    return {xp: xp, xpp: xpp};
}