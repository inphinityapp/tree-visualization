define( ["qlik","jquery", "text!./template.html"], function (qlik, $, template ) {'use strict';
return {
    template: template,
    initialProperties : {
      qHyperCubeDef : {
        qDimensions : [],
        qMeasures : [],
        qInitialDataFetch : [{
          qWidth : 7,
          qHeight : 1000
        }]
      }
    },
    definition : {
      type : "items",
      component : "accordion",
      items : {
        txt1: {
          label: 'Help',
          items: {
            ll: {label: "Add single numeric dimension as a tree position (any range).", component: "text"},
            l2: {label: "Add measures:", component: "text"},
            l3: {label: "1 - segment length factor (range 0 to 1)", component: "text"},
            l4: {label: "2 - Deflection angle (degrees)", component: "text"},
            l5: {label: "3 - Reduction factor (0 to 1)", component: "text"},
            l6: {label: "4 - Trunk size (any range)", component: "text"}
          },
        },
        dimensions : {
          uses : "dimensions",
          min : 1,
          max: 1,
        },
        measures : {
          uses : "measures",
          min : 4,
          max: 4
        },
        sorting : {
          uses : "sorting"
        },
        settings : {
          uses : "settings",
          items : {
            initFetchRows : {
              ref : "qHyperCubeDef.qInitialDataFetch.0.qHeight",
              label : "Initial fetch rows",
              type : "number",
              defaultValue : 50
            }
          }
        }
      }
    },
    support : {
      snapshot: true,
      export: true,
      exportData : true
    },
    paint: function ( ) {
      this.$scope.resetSize();
      this.$scope.trees = this.$scope.layout.qHyperCube.qDataPages[0].qMatrix.map((row,index) => {
        var min = this.$scope.layout.qHyperCube.qDimensionInfo[0].qMin;
        var max = this.$scope.layout.qHyperCube.qDimensionInfo[0].qMax;
        return {
          text: row[0].qText,
          x: (max==min)?0.5:(row[0].qNum-min)/(max-min),
          length: row[1].qNum,
          divergence: row[2].qNum,
          reduction: row[3].qNum,
          line_width: row[4].qNum
        };
      });
      
      this.$scope.trees.forEach(tree => this.$scope.paintTree(tree))
      
      return qlik.Promise.resolve();
    },
    controller: function($scope, $element){
      var canvas = $scope.canvas = $element.find("canvas")[0];
      var ctx = canvas.getContext("2d");
      $scope.auto = true;
      $scope.trees = [];
      var W = canvas.width;
      var H = canvas.height;

      $scope.resetSize = function() {
        W = canvas.width = $element.width();  
        H = canvas.height = $element.height();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, W, H);
      }

      var init = $scope.paintTree = function (tree) {
        var trunk = { x: 100+tree.x*(W-200) , y: length + 50, angle: 90 };
        
        ctx.font = "15px Arial";
        ctx.fillStyle = "brown";
        ctx.textAlign = "center"; 
        ctx.fillText(tree.text, trunk.x, H-20);
        ctx.beginPath();
        ctx.moveTo(trunk.x, H - 50);
        ctx.lineTo(trunk.x, H - trunk.y);
        ctx.strokeStyle = "brown";
        ctx.lineWidth = tree.line_width;
        ctx.stroke();
        branches(tree.length*H, tree.divergence, tree.reduction, tree.line_width, [trunk]);
      }

      function branches(length, divergence, reduction, line_width, start_points) {
          length = length * reduction;
          line_width = line_width * reduction;
          ctx.lineWidth = line_width;
          var new_start_points = [];
          ctx.beginPath();
          for (var i = 0; i < start_points.length; i++) {
              var sp = start_points[i];
              var ep1 = get_endpoint(sp.x, sp.y, sp.angle + divergence, length);
              var ep2 = get_endpoint(sp.x, sp.y, sp.angle - divergence, length);
              ctx.moveTo(sp.x, H - sp.y);
              ctx.lineTo(ep1.x, H - ep1.y);
              ctx.moveTo(sp.x, H - sp.y);
              ctx.lineTo(ep2.x, H - ep2.y);
              ep1.angle = sp.angle + divergence;
              ep2.angle = sp.angle - divergence;
              new_start_points.push(ep1);
              new_start_points.push(ep2);
          }
          if (length < 10) ctx.strokeStyle = "green";
          else ctx.strokeStyle = "brown";
          ctx.stroke();
          start_points = new_start_points;
          if (length > 2 && start_points.length < 10000) setTimeout(function(){
            branches(length, divergence, reduction, line_width, start_points)
          }, 1);
     }

    function get_endpoint(x, y, a, length) {
        var epx = x + length * Math.cos(a * Math.PI / 180);
        var epy = y + length * Math.sin(a * Math.PI / 180);
        return { x: epx, y: epy };
    }

    $scope.$watchCollection("params", function(){
      if($scope.auto) $scope.run();
    })

    $scope.run = function(){
      init();
    }
  }
};

} );
