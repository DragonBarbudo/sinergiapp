Vue.config.devtools = true;

var app = new Vue({
  el: '#app',
  components: {Swatches: window.VueSwatches.default},
  data: () => ({
    drawer: true,
    dialog: false,
    changelog: true,
    activePage: 0,
    pageCount : 0,
    temporals : [],
    runningVizualizer: true,
    db: configurations,
    plotterGw: 8,
    plotterGh: 13,
    viewgrid: false,
    material: {
      w: 320,
      h: 100,
      w_rendered: 0,
      h_rendered: 0,
      tipo: 'flexible',
      rigidoElegido : { id: 0, w:122, h:244 },
      flexibleElegido : {id:0, w: 320, t: 'Lona Front'},
      plotterElegido: { id:0, w: 60 },
      hFlexible: 100,
      hPlotter : 100,
      rebase: false,
      rebaseTipo: 0,
      rebases: { t:0, r:0, b:0, l:0, tb:0, lr:0},
      margen: false,
      medianil: {name: "0 mm", value:0.0},
      medianilPlotter: {name: "0 mm", value:0.0},
      pinza: true,
      guiaCorte : false
    },
    piezasExpansionPanel : [],
    piezas: [
      {w:Math.floor(Math.random()*40)+10, h:Math.floor(Math.random()*40)+10, q:Math.floor(Math.random()*10)+1, c:configurations.colorsList[Math.floor(Math.random() * configurations.colorsList.length)].c, parent:0},
    ],
    blocks: [],
    paginas : [{}]
  }),
  methods: {
    changeView: function(){
      this.viewgrid = !this.viewgrid;
    },
    downloadPDF : function(){
      this.dialog=true;
      return false;
      var pdf = new jsPDF('l', 'cm', [this.material.w, this.material.h]);
      svg2pdf(document.getElementById('svg'), pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
      });
      pdf.save('sinergia.pdf');
    },
    addGraphic : function(){
      this.piezas.push({w:30, h:30, q:1, c:this.db.colorsList[Math.floor(Math.random() * this.db.colorsList.length)].c });
    },
    deleteGraphic : function(index){
      this.piezas.splice(index, 1);
      this.piezasExpansionPanel = []
    },
    rotateGraphic : function(index, w, h){
      this.piezas[index].w = h;
      this.piezas[index].h = w;
    },
    separateGraphic : function(index, g, page){
      //console.log(index);
      //console.log(g.parent);

      if(this.piezas[g.parent].q>1){
        this.piezas[g.parent].q-=1;
        this.piezas.push({w:g.h, h:g.w, q:1, c:this.db.colorsList[Math.floor(Math.random() * this.db.colorsList.length)].c });
      } else {
        this.piezas[g.parent].w = g.h;
        this.piezas[g.parent].h = g.w;
      }
    },
    combineGraphics: function(p, index){
      var encontradas = [];
      for(var i=0; i<this.piezas.length; i++){
        if(this.piezas[i].w==p.w && this.piezas[i].h==p.h && i!=index){
          this.piezas[index].q+=this.piezas[i].q;
          encontradas.push(i);
        }
      }
      for(var d = encontradas.length-1; d>=0; d--){
        this.piezas.splice(encontradas[d], 1);
      }
    },
    fillout : function(index){
      var currentPages = this.paginas.length;

      this.filling = setInterval(function(){
        if(this.paginas.length > currentPages){
          clearInterval(this.filling);
          this.piezas[index].q--;
        } else {
          this.piezas[index].q++;
        }
      }.bind(this), 10);
    },
    materialSize: function(value){

      if(this.material.tipo=='flexible'){
        this.material.w = this.material.flexibleElegido.w;
        this.material.h = this.material.hFlexible;
      }

      if(this.material.tipo=='rigido'){
        this.material.w = this.material.rigidoElegido.w;
        this.material.h = this.material.rigidoElegido.h;
      }

      if(this.material.tipo=='plotter'){

        if(this.material.guiaCorte){
          this.material.w = 120;
          this.material.h = 150;
        } else {
          this.material.h = this.material.hPlotter;
          this.material.w = this.material.plotterElegido.w;
        }
      }
    },
    convertHex: function (color) {
        color = color.replace('#', '');
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);
        let result = 'rgba(' + r + ',' + g + ',' + b + ',' + .05 + ')';
        return result;
      }
  },
  computed : {
   viewboxSize: function(){
     return "0,"+"0,"+this.material.w+","+this.material.h;
   },


   visualizer : function(){



     this.activePage=0;

     this.material.w_rendered = this.material.w;
     this.material.h_rendered = this.material.h;
     if(this.material.tipo=='flexible'){
       if(this.material.pinza){
         this.material.w_rendered = this.material.w - 3;
         this.material.h_rendered = this.material.h - 3;
       }
     } else if(this.material.tipo=='rigido'){
       //Margen para corte
       if(this.material.margen){
         this.material.w_rendered = this.material.w - 2;
         this.material.h_rendered = this.material.h - 2;
       }
     } else if(this.material.tipo == 'plotter'){
       if(this.material.guiaCorte){
         this.material.w_rendered = this.material.w - 16;
         this.material.h_rendered = this.material.h - 56;
       } else { //Pinza
         this.material.w_rendered = this.material.w - 3;
         this.material.h_rendered = this.material.h - 3;
       }
     }

     var pageCount = 0;
     var temporals = [];

     //CREATE PAGE 1
     this.paginas = [
       { graphics: [], ocupado:0 }
     ]

     //Reseting Blocks packer: Array 1
     this.blocks = [];
     //Cleaning full graphics per page: Array 2
     this.graficos = [];

     //Convert pieces to individual graphics and store'em in blocks
     for(var p = 0; p<this.piezas.length; p++){
       for(var pi = 0; pi<this.piezas[p].q; pi++){
         var extraW = 0;
         var extraH = 0;
         //RIGIDO > MEDIANIL
         if(this.material.tipo=='rigido'){
           extraW = this.material.medianil.value*2;
           extraH = this.material.medianil.value*2
         }
         //PLOTTER > MEDIANIL
         if(this.material.tipo=='plotter'){
           extraW = this.material.medianilPlotter.value*2;
           extraH = this.material.medianilPlotter.value*2
         }
         //FLEXIBLE > REBASE
         if(this.material.tipo=='flexible'){
           extraW = (parseFloat(this.material.rebases.l) + parseFloat(this.material.rebases.r));
           extraH = (parseFloat(this.material.rebases.t) + parseFloat(this.material.rebases.b));
         }
         var finalPiece = {
           w: parseFloat(this.piezas[p].w) + parseFloat(extraW),
           h: parseFloat(this.piezas[p].h) + parseFloat(extraH),
           c: this.piezas[p].c,
           parent: this.piezas[p].parent
         };
         this.blocks.push( finalPiece );

       }
     }


     //FOR of PAGES
     var endVizualizer = false;
     while(!endVizualizer){



        //Define packer container
        var packer = new Packer(this.material.w_rendered, this.material.h_rendered);
        //Sort each block > biggest to smallest
        //this.blocks.sort(function(a,b) { return (b.h < a.h); });
        this.blocks.sort(function(a,b) { return (b.w < a.w); });



        //Sort inside the packer area
        packer.fit(this.blocks);

        //Fit in area? Store each block in the page where it Fit
        //Otherwise save this in a new page
        for(var n = 0; n<this.blocks.length; n++){
          var block = this.blocks[n];
          if(block.fit){ //FITS

            var theGraphic;

            var gY = block.fit.y;
            var gX = block.fit.x;

            if(this.material.tipo=='rigido'){
              //Margen
                if(this.material.margen){
                  gY+=1;
                  gX+=1;
                }
            } else if(this.material.tipo=='flexible'){
              //Pinza
              if(this.material.pinza){
                gY+=1.5;
                gX+=1.5;
              }
            } else if(this.material.tipo=='plotter'){
              //Guía para corte
              if(this.material.guiaCorte){
                gY+=this.plotterGh;
                gX+=this.plotterGw;
              } else { //Pinza
                gY+=1.5;
                gX+=1.5;
              }
            }

            theGraphic = {
              y: gY,
              x: gX,
              w: block.w,
              h: block.h,
              c: block.c,
              parent: block.parent
            };


            this.paginas[pageCount].graphics.push( theGraphic );
            //this.graficos.push( theGraphic );
            this.paginas[pageCount].ocupado+= block.w * block.h;
          }
          else { //DOESNT FITS... new page
            var theGraphic = { w:block.w, h:block.h, c:block.c, parent:block.parent };
            temporals.push(theGraphic);

          }
        }


        if(temporals.length>0 && this.paginas[pageCount].graphics.length>0 && pageCount<200){
          this.blocks = temporals;
          this.paginas[pageCount+1] = { graphics: [], ocupado:0 }
          temporals = [];
          pageCount++;
        } else {
          endVizualizer = true;
        }





      }//for of pages














   } //ends visualizer


  },
  watch: {
    material: {
        handler(val){

          if(this.material.rebaseTipo==0){
            this.material.rebases.l = 0;
            this.material.rebases.r = 0;
            this.material.rebases.lr = 0;
            this.material.rebases.t = val.rebases.tb;
            this.material.rebases.b = val.rebases.tb;

          }
          if(this.material.rebaseTipo==1){
            this.material.rebases.t = 0;
            this.material.rebases.b = 0;
            this.material.rebases.tb = 0;

            this.material.rebases.l = val.rebases.lr;
            this.material.rebases.r = val.rebases.lr;
          }

      },
      deep:true
    }
  }
})



app.materialSize();
