var ImgWarper = ImgWarper || {};

ImgWarper.PointDefiner = function (canvas, imgData, ori, dst) {
  // this.oriPoints = new Array();
  // this.dstPoints = new Array();
  this.oriPoints = ori;
  this.dstPoints = dst;

  //set up points for change;
  const c = canvas;
  this.canvas = canvas;
  this.dragging_ = false;
  this.computing_ = false;
  // $(c).unbind();
  // $(c).bind('mousedown', function (e) { that.touchStart(e); });
  // $(c).bind('mousemove', function (e) { that.touchDrag(e); });
  // $(c).bind('mouseup', function (e) { that.touchEnd(e); });
  this.currentPointIndex = -1;
  this.imgWarper = new ImgWarper.Warper(c, imgData);
  // this.redrawCanvas();
};

ImgWarper.PointDefiner.prototype.redrawCanvas = function (points) {
  const ctx = this.canvas.getContext("2d");
  // console.log(ctx);
  for (let i = 0; i < this.oriPoints.length; i++) {
    // console.log(this.oriPoints[i]);
    if (i < this.dstPoints.length) {
      if (i == this.currentPointIndex) {
        this.drawOnePoint(this.dstPoints[i], ctx, "orange");
      } else {
        // console.log(this.dstPoints[i]);

        this.drawOnePoint(this.dstPoints[i], ctx, "red");
      }

      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.moveTo(this.oriPoints[i].x, this.oriPoints[i].y);
      ctx.lineTo(this.dstPoints[i].x, this.dstPoints[i].y);
      ctx.strokeStyle = "yellow";
      ctx.stroke();
    } else {
      this.drawOnePoint(this.oriPoints[i], ctx, "#119a21");
    }
  }
  ctx.stroke();
};

ImgWarper.PointDefiner.prototype.drawOnePoint = function (
  point,
  ctx,
  color
) {
  // console.log("draw one point")
  // console.log(point);
  // console.log(ctx);
  // console.log(color);
  const radius = 10;
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.arc(
    parseInt(point.x),
    parseInt(point.y),
    radius,
    0,
    2 * Math.PI,
    false
  );
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.arc(parseInt(point.x), parseInt(point.y), 3, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();
};

ImgWarper.Warper = function (
  canvas,
  imgData,
  optGridSize,
  optAlpha
) {
  this.alpha = optAlpha || 1;
  this.gridSize = optGridSize || 20;
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.width = canvas.width;
  this.height = canvas.height;
  this.imgData = imgData.data;
  this.bilinearInterpolation = new ImgWarper.BilinearInterpolation(
    this.width,
    this.height,
    canvas
  );

  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.putImageData(imgData, 0, 0);
  // console.log('drawn');
  // 网格 20
  this.grid = [];
  for (let i = 0; i < this.width; i += this.gridSize) {
    for (let j = 0; j < this.height; j += this.gridSize) {
      let a = new ImgWarper.Point(i, j);
      let b = new ImgWarper.Point(i + this.gridSize, j);
      let c = new ImgWarper.Point(i + this.gridSize, j + this.gridSize);
      let d = new ImgWarper.Point(i, j + this.gridSize);
      this.grid.push([a, b, c, d]);
    }
  }
};

ImgWarper.Warper.prototype.warp = function (fromPoints, toPoints) {
  const t0 = new Date().getTime();
  const deformation = new ImgWarper.AffineDeformation(
    toPoints,
    fromPoints,
    this.alpha
  );
  // grid 总网格数
  const transformedGrid = [];
  for (let i = 0; i < this.grid.length; ++i) {
    transformedGrid[i] = [
      deformation.pointMover(this.grid[i][0]),
      deformation.pointMover(this.grid[i][1]),
      deformation.pointMover(this.grid[i][2]),
      deformation.pointMover(this.grid[i][3]),
    ];
  }
  // var t1 = (new Date()).getTime();
  const newImg = this.bilinearInterpolation.generate(
    this.imgData,
    this.grid,
    transformedGrid
  );
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.putImageData(newImg, 0, 0);
  // var t2 = (new Date()).getTime();
  // document.getElementById('fps').innerHTML =
  //   'Deform: ' + (t1 - t0) + 'ms; interpolation: ' + (t2 - t1) + 'ms';
  // if (document.getElementById('show-grid').checked) {
  //   this.drawGrid(fromPoints, toPoints);
  // }
};

ImgWarper.Warper.prototype.drawGrid = function (fromPoints, toPoints) {
  // Forward warping.
  const deformation = new ImgWarper.AffineDeformation(
    fromPoints,
    toPoints,
    this.alpha
  );
  const context = this.canvas.getContext("2d");
  for (let i = 0; i < this.grid.length; ++i) {
    context.beginPath();
    let point = deformation.pointMover(this.grid[i][0]);
    context.moveTo(point.x, point.y);
    for (let j = 1; j < 4; ++j) {
      point = deformation.pointMover(this.grid[i][j]);
      context.lineTo(point.x, point.y);
    }
    context.strokeStyle = "rgba(170, 170, 170, 0.5)";
    context.stroke();
  }
};

ImgWarper.AffineDeformation = function (fromPoints, toPoints, alpha) {
  this.w = null;
  this.pRelative = null;
  this.qRelative = null;
  this.A = null;
  if (fromPoints.length != toPoints.length) {
    console.error("Points are not of same length.");
    return;
  }
  this.n = fromPoints.length;
  this.fromPoints = fromPoints;
  this.toPoints = toPoints;
  this.alpha = alpha;
};

ImgWarper.AffineDeformation.prototype.pointMover = function (point) {
  // n 偏移点数量
  if (null == this.pRelative || this.pRelative.length < this.n) {
    this.pRelative = new Array(this.n);
  }
  if (null == this.qRelative || this.qRelative.length < this.n) {
    this.qRelative = new Array(this.n);
  }
  if (null == this.w || this.w.length < this.n) {
    this.w = new Array(this.n);
  }
  if (null == this.A || this.A.length < this.n) {
    this.A = new Array(this.n);
  }

  for (let i = 0; i < this.n; ++i) {
    // console.log(point);
    // console.log(this.fromPoints[i]);
    // console.log(this.fromPoints[i].add(point));
    // var a = {x: 1, y:1};
    // var b = {x: 2, y:2};
    // console.log(a.add(b));
    const t = this.fromPoints[i].subtract(point);
    this.w[i] = Math.pow(t.x * t.x + t.y * t.y, -this.alpha);
  }

  const pAverage = ImgWarper.Point.weightedAverage(this.fromPoints, this.w);
  const qAverage = ImgWarper.Point.weightedAverage(this.toPoints, this.w);

  for (let i = 0; i < this.n; ++i) {
    this.pRelative[i] = this.fromPoints[i].subtract(pAverage);
    this.qRelative[i] = this.toPoints[i].subtract(qAverage);
  }

  let B = new ImgWarper.Matrix22(0, 0, 0, 0);

  for (let i = 0; i < this.n; ++i) {
    B.addM(this.pRelative[i].wXtX(this.w[i]));
  }

  B = B.inverse();
  for (let j = 0; j < this.n; ++j) {
    this.A[j] =
      point.subtract(pAverage).multiply(B).dotP(this.pRelative[j]) *
      this.w[j];
  }

  let r = qAverage; //r is an point
  for (let j = 0; j < this.n; ++j) {
    r = r.add(this.qRelative[j].multiply_d(this.A[j]));
  }
  return r;
};

ImgWarper.BilinearInterpolation = function (width, height, canvas) {
  this.width = width;
  this.height = height;
  this.ctx = canvas.getContext("2d");
  this.imgTargetData = this.ctx.createImageData(this.width, this.height);
};

ImgWarper.BilinearInterpolation.prototype.generate = function (
  source,
  fromGrid,
  toGrid
) {
  this.imgData = source;
  for (let i = 0; i < toGrid.length; ++i) {
    this.fill(toGrid[i], fromGrid[i]);
  }
  return this.imgTargetData;
};

ImgWarper.BilinearInterpolation.prototype.fill = function (
  sourcePoints,
  fillingPoints
) {
  let i, j;
  let srcX, srcY;
  let x0 = fillingPoints[0].x;
  let x1 = fillingPoints[2].x;
  let y0 = fillingPoints[0].y;
  let y1 = fillingPoints[2].y;
  x0 = Math.max(x0, 0);
  y0 = Math.max(y0, 0);
  x1 = Math.min(x1, this.width - 1);
  y1 = Math.min(y1, this.height - 1);

  let xl, xr, topX, topY, bottomX, bottomY;
  let yl, yr, rgb, index;
  for (i = x0; i <= x1; ++i) {
    xl = (i - x0) / (x1 - x0);
    xr = 1 - xl;
    topX = xr * sourcePoints[0].x + xl * sourcePoints[1].x;
    topY = xr * sourcePoints[0].y + xl * sourcePoints[1].y;
    bottomX = xr * sourcePoints[3].x + xl * sourcePoints[2].x;
    bottomY = xr * sourcePoints[3].y + xl * sourcePoints[2].y;
    for (j = y0; j <= y1; ++j) {
      yl = (j - y0) / (y1 - y0);
      yr = 1 - yl;
      srcX = topX * yr + bottomX * yl;
      srcY = topY * yr + bottomY * yl;
      index = (j * this.width + i) * 4;
      if (
        srcX < 0 ||
        srcX > this.width - 1 ||
        srcY < 0 ||
        srcY > this.height - 1
      ) {
        this.imgTargetData.data[index] = 255;
        this.imgTargetData.data[index + 1] = 255;
        this.imgTargetData.data[index + 2] = 255;
        this.imgTargetData.data[index + 3] = 255;
        continue;
      }
      const srcX1 = Math.floor(srcX);
      const srcY1 = Math.floor(srcY);
      const base = (srcY1 * this.width + srcX1) * 4;
      //rgb = this.nnquery(srcX, srcY);
      this.imgTargetData.data[index] = this.imgData[base];
      this.imgTargetData.data[index + 1] = this.imgData[base + 1];
      this.imgTargetData.data[index + 2] = this.imgData[base + 2];
      this.imgTargetData.data[index + 3] = this.imgData[base + 3];
    }
  }
};

ImgWarper.BilinearInterpolation.prototype.nnquery = function (x, y) {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const base = (y1 * this.width + x1) * 4;
  return [
    this.imgData[base],
    this.imgData[base + 1],
    this.imgData[base + 2],
    this.imgData[base + 3],
  ];
};

ImgWarper.BilinearInterpolation.prototype.query = function (x, y) {
  let x1, x2, y1, y2;
  x1 = Math.floor(x);
  x2 = Math.ceil(x);
  y1 = Math.floor(y);
  y2 = Math.ceil(y);

  const c = [0, 0, 0, 0]; // get new RGB

  const base11 = (y1 * this.width + x1) * 4;
  const base12 = (y2 * this.width + x1) * 4;
  const base21 = (y1 * this.width + x2) * 4;
  const base22 = (y2 * this.width + x2) * 4;
  // 4 channels: RGBA
  for (let i = 0; i < 4; ++i) {
    let t11 = this.imgData[base11 + i];
    let t12 = this.imgData[base12 + i];
    let t21 = this.imgData[base21 + i];
    let t22 = this.imgData[base22 + i];
    let t =
      (t11 * (x2 - x) * (y2 - y) +
        t21 * (x - x1) * (y2 - y) +
        t12 * (x2 - x) * (y - y1) +
        t22 * (x - x1) * (y - y1)) /
      ((x2 - x1) * (y2 - y1));
    c[i] = parseInt(t);
  }
  return c;
};

ImgWarper.Matrix22 = function (N11, N12, N21, N22) {
  this.M11 = N11;
  this.M12 = N12;
  this.M21 = N21;
  this.M22 = N22;
};

ImgWarper.Matrix22.prototype.adjugate = function () {
  return new ImgWarper.Matrix22(this.M22, -this.M12, -this.M21, this.M11);
};

ImgWarper.Matrix22.prototype.determinant = function () {
  return this.M11 * this.M22 - this.M12 * this.M21;
};

ImgWarper.Matrix22.prototype.multiply = function (m) {
  this.M11 *= m;
  this.M12 *= m;
  this.M21 *= m;
  this.M22 *= m;
  return this;
};

ImgWarper.Matrix22.prototype.addM = function (o) {
  this.M11 += o.M11;
  this.M12 += o.M12;
  this.M21 += o.M21;
  this.M22 += o.M22;
};

ImgWarper.Matrix22.prototype.inverse = function () {
  return this.adjugate().multiply(1.0 / this.determinant());
};

ImgWarper.Point = function (x, y) {
  this.x = x;
  this.y = y;
};

ImgWarper.Point.prototype.add = function (o) {
  return new ImgWarper.Point(this.x + o.x, this.y + o.y);
};

ImgWarper.Point.prototype.subtract = function (o) {
  return new ImgWarper.Point(this.x - o.x, this.y - o.y);
};

// w * [x; y] * [x, y]
ImgWarper.Point.prototype.wXtX = function (w) {
  return new ImgWarper.Matrix22(
    this.x * this.x * w,
    this.x * this.y * w,
    this.y * this.x * w,
    this.y * this.y * w
  );
};

// Dot product
ImgWarper.Point.prototype.dotP = function (o) {
  return this.x * o.x + this.y * o.y;
};

ImgWarper.Point.prototype.multiply = function (o) {
  return new ImgWarper.Point(
    this.x * o.M11 + this.y * o.M21,
    this.x * o.M12 + this.y * o.M22
  );
};

ImgWarper.Point.prototype.multiply_d = function (o) {
  return new ImgWarper.Point(this.x * o, this.y * o);
};

ImgWarper.Point.weightedAverage = function (p, w) {
  let i;
  let sx = 0,
    sy = 0,
    sw = 0;

  for (i = 0; i < p.length; i++) {
    sx += p[i].x * w[i];
    sy += p[i].y * w[i];
    sw += w[i];
  }
  return new ImgWarper.Point(sx / sw, sy / sw);
};

ImgWarper.Point.prototype.InfintyNormDistanceTo = function (o) {
  return Math.max(Math.abs(this.x - o.x), Math.abs(this.y - o.y));
};


export { ImgWarper };