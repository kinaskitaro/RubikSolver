import { useState } from 'react'
import './App.css'
import { createSolvedCube, isSolved } from './engine/cubeState'
import { solveCube } from './engine/solverAdapter'

function App() {
  const [cube, setCube] = useState(createSolvedCube())
  const [moves, setMoves] = useState<string[]>([])
  const [error,setError]=useState('')

  async function handleSolve(){
    try{
      if(!isSolved(cube)) throw new Error('Invalid cube state')
      const seq=await solveCube(cube)
      setMoves(seq)
      setError("")
    }catch(e){setError(String(e))}
  }

  return (
    <div style={{padding:20}}>
       <h1>Rubik’s Cube Solver</h1>
       <textarea value={cube} onChange={e=>setCube(e.target.value)} rows={6} cols={30}/>
       <br/>
       <button onClick={handleSolve}>Solve</button>
       {error && <pre style={{color:'red'}}>{error}</pre>}
       {moves.length>0 && (
         <> 
           <h2>Solution ({moves.length})</h2>
           <p>{moves.join(' ')}</p>
         </>
       )}
    </div>
  );
}

export default App
