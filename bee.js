const { Area } = require('./area');
const { generateGraph } = require('./areaGenerator');

function generateAreas(numberOfAreas, graph) {
  const areas = [];
  for (let i = 0; i < numberOfAreas; i++) {
    const area = new Area(graph);
    areas.push(area);
  }
  return areas;
}

function chooseArea(targetValues) {
  let chosenArea;
  chosenArea = targetValues.indexOf(Math.min(...targetValues.filter((value) => value !== null)));
  return chosenArea;
}

function foragerVertices(currentArea, verticesQueue) {
  if (currentArea.lastSwap.some((vertice) => vertice === null)) {
    const currentVertice = currentArea.graph.map((vertice) => vertice.join(',')).indexOf(verticesQueue[0].join(','));
    const neighbor = currentArea.graph[currentVertice][0];
    currentArea.lastSwap = [currentVertice, neighbor];
  } else {
    if (currentArea.graph[currentArea.lastSwap[0]].indexOf(currentArea.lastSwap[1]) === currentArea.graph[currentArea.lastSwap[0]].length-1) {
      const lastPosition = verticesQueue.map((vertice) => vertice.join(',')).indexOf(currentArea.graph[currentArea.lastSwap[0]].join(','));
      const currentVertice = currentArea.graph.map((vertice) => vertice.join(',')).indexOf(verticesQueue[(lastPosition + 1) % verticesQueue.length].join(','));
      const neighbor = currentArea.graph[currentVertice][0];
      currentArea.lastSwap = [currentVertice, neighbor];
    } else {
      currentArea.lastSwap[1] = currentArea.graph[currentArea.lastSwap[0]][currentArea.graph[currentArea.lastSwap[0]].indexOf(currentArea.lastSwap[1]) + 1];
    }
  }
}

function checkSwapConflicts(currentArea, currentSwap) {
  let currentConflicts = 0;
  for (let neighbor = 0; neighbor < currentArea.graph[currentSwap[1]].length; neighbor++) {
    const currentColor = currentArea.coloring[currentSwap[0]];
    if (currentArea.coloring[currentArea.graph[currentSwap[1]][neighbor]] === currentColor && currentArea.graph[currentSwap[1]][neighbor] !== currentSwap[0]) {
      currentConflicts++;
    }
  }
  let neighborConflicts = 0;
  for (let neighbor = 0; neighbor < currentArea.graph[currentSwap[0]].length; neighbor++) {
    const neighborColor = currentArea.coloring[currentSwap[1]];
    if (currentArea.coloring[currentArea.graph[currentSwap[0]][neighbor]] === neighborColor && currentArea.graph[currentSwap[0]][neighbor] !== currentSwap[1]) {
      neighborConflicts++;
    }
  }
  return [currentConflicts, neighborConflicts];
}

function getVerticesQueue(currentArea) {
  const sortedColors = [...currentArea.usedColors].sort((a, b) => currentArea.evaluation[currentArea.usedColors.indexOf(a)] - currentArea.evaluation[currentArea.usedColors.indexOf(b)]);
  const verticesQueue = [...currentArea.graph].sort((a, b) => sortedColors.indexOf(currentArea.coloring[currentArea.graph.map((v) => v.join(',')).indexOf(a.join(','))]) - sortedColors.indexOf(currentArea.coloring[currentArea.graph.map((v) => v.join(',')).indexOf(b.join(','))]));
  return verticesQueue;
}

function beeAlgorithm(foragers, scouts, step, limit, graph) {
  const areas = generateAreas(scouts, graph);
  const initialChromaticNumber = Math.min(...areas.map((area) => area.usedColors.length));
  console.log('Initial chromatic number:', initialChromaticNumber);

  for (let iteration = 0; iteration < limit; iteration++) {

    let targetValues = [];
    for (let i = 0; i < areas.length; i++) {
      targetValues.push(Math.min(...areas[i].evaluate()));
    }

    const currentChromaticNumber = Math.min(...areas.map((area) => area.usedColors.length));

    if (iteration % step === 0) {
      console.log('Iteration:',iteration, 'Chromatic number:', currentChromaticNumber);
    }

    if (currentChromaticNumber < initialChromaticNumber) {
      console.log('Iteration (done):', iteration, 'Chromatic number:', currentChromaticNumber);
      return 0;
    }

    let availableForagers = foragers;
    for (let scout = 0; scout < scouts; scout++) {
      const currentForagers = Math.ceil(availableForagers / (scouts-scout));
      availableForagers -= currentForagers;

      const chosenArea = chooseArea(targetValues, scout);
      targetValues[chosenArea] = null;
      
      const currentArea = areas[chosenArea];
      const verticesQueue = getVerticesQueue(currentArea);

      for (let forager = 0; forager < currentForagers; forager++) {
        foragerVertices(currentArea, verticesQueue);

        const currentSwap = currentArea.lastSwap;
  
        const [currentConflicts, neighborConflicts] = checkSwapConflicts(currentArea, currentSwap);
  
        if (neighborConflicts > 0 && currentConflicts > 0) {
          forager--;
        } else if (neighborConflicts === 0) {
          const currentColor = currentArea.coloring[currentSwap[0]];
          const neighborColor = currentArea.coloring[currentSwap[1]];
          currentArea.coloring[currentSwap[0]] = neighborColor;
          currentArea.coloring[currentSwap[1]] = currentColor;
  
          let colorSwapCounter = 0;
          let usedColorsCounter = 0;
          while (usedColorsCounter < currentArea.usedColors.length) {
            let additionalConflicts = 0;
            const currentUsedColor = currentArea.usedColors[usedColorsCounter];
            for (let neighbor = 0; neighbor < currentArea.graph[currentSwap[1]].length; neighbor++) {
              if (currentArea.coloring[currentArea.graph[currentSwap[1]][neighbor]] === currentUsedColor) {
                additionalConflicts++;
              }
            }
            if (additionalConflicts === 0 && currentArea.coloring[currentSwap[1]] !== currentUsedColor) {
              colorSwapCounter++;
              currentArea.coloring[currentSwap[1]] = currentUsedColor;
              usedColorsCounter = currentArea.usedColors.length;
              currentArea.evaluate();
              if (currentArea.usedColors.length < initialChromaticNumber) {
                console.log('Iteration (done):', iteration, 'Chromatic number:', currentArea.usedColors.length);
                return 0;
              }
            } else {
              usedColorsCounter++;
            }
          }
          if (colorSwapCounter === 0 && currentConflicts > 0) {
            const currentColor = currentArea.coloring[currentSwap[0]];
            const neighborColor = currentArea.coloring[currentSwap[1]];
            currentArea.coloring[currentSwap[0]] = neighborColor;
            currentArea.coloring[currentSwap[1]] = currentColor;
          }
        }
      }
    }
  }
}

const graph = generateGraph(300, 30);
beeAlgorithm(150*18, 18, 10, 10000, graph);