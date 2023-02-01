require(["esri/config",
         "esri/Map",
         "esri/views/MapView",
         "esri/layers/FeatureLayer",
         "esri/symbols/WebStyleSymbol",
         "esri/Basemap",
         "esri/rest/support/TopFeaturesQuery",
         "esri/rest/support/TopFilter"],
         (esriConfig,
          Map,
          MapView,
          FeatureLayer,
          WebStyleSymbol,
          Basemap,
          TopFeaturesQuery,
          TopFilter)=>(async ()=>{
            //API KEY
            esriConfig = "AAPKc0b5b552c4324dc29a90351172d2b735eM1eJrecMDQYEQZi4rnGIPsjY_Llxx1p0nXXbkHOEsxXmYiO6lqTiBkAGXsSplrm";
             // dark human geography basemap
            const basemap = new Basemap({
            portalItem: {
            id: "4f2e99ba65e34bb8af49733d9778fb8e"}});
            //Capa de caserios
            const layer = new FeatureLayer({
                url: "https://services3.arcgis.com/U26uBjSD32d7xvm2/arcgis/rest/services/HNPOB1/FeatureServer",
                outFields: ["*"],
                renderer: await setRenderer(),
                popupTemplate: createPopupTemplate()
              });
            //Nuevo mapa
              const map = new Map({
                basemap,
                layers: [layer]
              });
            const viewDiv = document.getElementById("viewDiv");
            //Nuevo vista de mapa 
            const view = new MapView({
                container: viewDiv,
                map: map,
                center: [-86.241905,15.199999],
                zoom: 6,
                padding: {
                  right: 380
                }});
            //Metodo para indicar que cuando el layer se visualiza en la vista del mapa
            const layerView = await view.whenLayerView(layer);
            //agarrar el grupo de datos para los botones
            const orderDirectionSelection = document.getElementById("orderDirectionSelection");
            //agarrar el grupo de los datos filtrados por campos
            const orderByFieldSelection = document.getElementById("orderByFieldSelect");
            //boton de limpiar query
            const clearQueryButton = document.getElementById("clear-query");
            //boton de generar querys
            const queryParksButton = document.getElementById("query-parks");
            //generar evento al hacer click sobre el boton de generar querys
            queryParksButton.addEventListener("click",async()=>{
              //estilos de los botones al momento de hacer click
              clearQueryButton.appearance = "outline";
              queryParksButton.appearance = "solid";
              //variable que selecciona los valores de cada seleect del selectgroup
              const queryOrder = orderDirectionSelection.selectedItem.value;
              //arreglo que contiene un filtro de los valores de cada selectoption
              const orderByField = [`${orderByFieldSelection.selectedOption.value} ${queryOrder}`];
              // Parámetro TopFeatureQuery para el método queryTopFeatures
              // recopila las entradas del usuario para consultar la mayor o la menor cantidad
              query = new TopFeaturesQuery({
                topFilter: new TopFilter({
                  topCount: parseInt(topCountSelect.selectedOption.value),
                  groupByFields: ["GEOCODIGO "],
                  orderByFields: orderByField
                }),
                orderByFields: orderByField,
                outFields: ["GEOCODIGO , NOMBRE , PO1998 , POB2001 , POB2013"],
                returnGeometry: true,
                cacheHint: false
              });
              //funcion que almacena el filtro de entidades seleccionadas
              const results = await layer.queryTopFeatures(query);
              //llamaremos el div resultsDiv y le cambiaremos el style none a block
              document.getElementById("resultsDiv").style.display = "block";
              //le escribiremos un texto dinamico al elemento h3 resultsHeading que cuenta el total de entidades filtradas
              document.getElementById("resultsHeading").innerHTML = `Resultado: ${results.features.length} Departamentos`;
              //resultados tendra un texto vacio en caso de no ser positiva la consulta
              document.getElementById("results").innerHTML = "";
              //graphics almacenara un array de las entidades filtradas 
              graphics = results.features;
              //iteraremos sobre nuestro arreglo de entidades filtradas para crear un elemento html
              //un elemento en lista que tendra como etiquetas los valores de las entidades filtradas por campo
              graphics.forEach((result, index) => {
                const attributes = result.attributes;
                const item = document.createElement("calcite-pick-list-item");
                item.setAttribute("label", attributes.NOMBRE);
                item.setAttribute("value", index);
    
                const visitorTotal = orderByFieldSelection.selectedOption.value;
                const total = `POBTOTAL: ${attributes[visitorTotal]}`;
                const state = `State: ${attributes.NOMBRE}`;
                const description = total + "\n" + state;
                item.setAttribute("description", description);
                item.addEventListener("click", parkResultClickHandler);
                document.getElementById("results").appendChild(item);
              });
              //establecer consulta para queryTopObjectIds.
               query.orderByFields = [""];
               const objectIds = await layer.queryTopObjectIds(query);
               layerView.filter = {objectIds};}
            );
            //funcion al momneto de hacer click sobre cada value se abra el popup
            function parkResultClickHandler(event) {
              const target = event.target;
              const resultId = target.getAttribute("value");
      
              // get the graphic corresponding to the clicked zip code
              const result =
                resultId && graphics && graphics[parseInt(resultId, 10)];
      
              if (result) {
                view.popup.open({
                  features: [result],
                  location: result.geometry
                });
              }
            }
            //funcion al momento de hacer click sobre el boton
            clearQueryButton.addEventListener("click", () => {
              clearQueryButton.appearance = "solid";
              queryParksButton.appearance = "outline";
              layerView.filter = null;
              view.popup.close();
              document.getElementById("resultsHeading").innerHTML = `Results`;
              document.getElementById("results").innerHTML = "";
            });
            //funcion para renderizar el estilo de la capa
            async function setRenderer() {
              const symbol = new WebStyleSymbol({
                name: "atm",
                styleName: "Esri2DPointSymbolsStyle"
              });
      
              const cimSymbol = await symbol.fetchCIMSymbol();
              const symbolLayer = cimSymbol.data.symbol.symbolLayers[0];
              symbolLayer.size = 16;
              cimSymbol.data.symbol.symbolLayers = [symbolLayer];
      
              return {
                type: "simple",
                symbol: cimSymbol
              };
            }
            //funcion de popup
            function createPopupTemplate() {
              return {
                title: "{NOMBRE}",
                content: [
                  {
                    type: "fields",
                    fieldInfos: [
                      {
                        fieldName: "POBTOTAL",
                        label: "Total poblacion",
                        format: {
                          places: 0,
                          digitSeparator: true
                        }
                      },
                      {
                        fieldName: "PO1998",
                        label: "POB 1998",
                        format: {
                          places: 0,
                          digitSeparator: true
                        }
                      },
                      {
                        fieldName: "POB2001",
                        label: "POB 2001",
                        format: {
                          places: 0,
                          digitSeparator: true
                        }
                      },
                      {
                        fieldName: "POB2013",
                        label: "POB 2013",
                        format: {
                          places: 0,
                          digitSeparator: true
                        }
                      }
                    ]
                  }
                ]
              };
            }
          })());