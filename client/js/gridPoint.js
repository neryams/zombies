function gridPoint(clone) {
    if(clone) {
        this.x = clone.x;
        this.y = clone.y;
    }
    return this;
}
gridPoint.prototype = {
    x: null,
    y: null,
    directions: [{y:-1,x:0},{y:0,x:-1},{y:1,x:0},{y:0,x:1}]
};
gridPoint.prototype.setCoords = function(x,y) {
    this.x = x;
    this.y = y;
};
gridPoint.prototype.addCoords = function(x,y) {
    this.x += x;
    this.y += y;
};
gridPoint.prototype.equals = function(gridpoint) {
    return this.x == gridpoint.x && this.y == gridpoint.y;
};