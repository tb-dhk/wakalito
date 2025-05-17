import { useEffect, useState, useRef } from "react";
import Fade from '@mui/material/Fade';
import './App.css';
import { wakalitoDict, wakalitoDesc, rubify, lessons, numbers, words } from './dict.js'
import ProgressBar from "@ramonak/react-progress-bar";

const selectedStyle = {backgroundColor: "#fff7d6", color: "#1f2637"}

function keyToRad(key, spec=false) {
  if (key) {
    var keys = Array.from("󱲉󱲚󱲋󱲂󱲓󱲆󱲐󱲙󱲈󱲃󱲔󱲇󱲌󱲅󱲎󱲍、︁");
    if (spec) {
      keys = keys.concat(Array.from("⌫␣↵"))
    }
    const qwerty = [
      ...Array.from("123456qwertyasdfg"),
      "backspace", "", " ", "enter"
    ]
    return keys[qwerty.indexOf(key.toLowerCase())] || "";  // return empty string if not found
  }
}

function keysToRads(str) {
  if (!str) {
    return ""
  }
  return Array.from(str)
    .map(char => keyToRad(char))
    .join("");
}

function Suggestions(props) {
  const possible = props.radicals && Object.keys(Object.assign(wakalitoDict, wakalitoDesc))
    .filter(a => a.toLowerCase().startsWith(props.radicals))
    .sort(); // <-- this sorts the keys alphabetically

  return (
    <div>
      {
        possible && possible.map(a => (
          <div className="possibility-grid two-col" key={a}>
            <div> {props.ruby ? rubify(wakalitoDict[a]) : wakalitoDict[a]} </div>
            <div> {keysToRads(a)} </div>
          </div>
        ))
      }
    </div>
  );
}

function Lessons(props) {
  return (
    <div className="lesson-grid">
      {
        lessons.map((text, ind) => (
          <div>
            <div className="lesson-name two-col" style={ind === props.lesson ? selectedStyle : {}} onClick={() => props.setLesson(ind)}>
              <div style={ind === props.lesson ? selectedStyle : {}}>{numbers(ind+1)}</div>
              <div style={ind === props.lesson ? selectedStyle : {}}>{ind === 16 ? "󱥠󱤆" : text}</div>
            </div>
            <ProgressBar 
              completed={getProgress(ind)} 
              bgColor={progressColor(getProgress(ind))} 
              customLabel={`󱥻${numbers(Math.floor(getProgress(ind)))}`}
            />
          </div>
        ))
      }
    </div>
  )
}

function Keyboard(props) {
  const keys = Array.from("󱲉󱲚󱲋󱲂󱲓󱲆󱲐󱲙󱲈󱲃󱲔󱲇󱲌󱲅󱲎󱲍󱲜⌫ ␣↵")
  const qwerty = "123456qwertyasdfg"
  return (
    <div id="keyboard-grid">
      {
        keys.map((key, ind) => {
          var className = "key"
          var cornerName = "corner-label"
          if (key === "␣") {
            className += " space"
          }

          var pressed = props.pressed
          if (typeof(pressed) === "string") {
            pressed = pressed.toLowerCase()
          }
          if (key === keyToRad(pressed, true)) {
            className += " pressed"
            cornerName += " pressed"
          }
          return (
            <div className={className}>
              {key}
              <span className={cornerName}>{ind < 17 && props.qwerty ? qwerty[ind] : ""}</span>
            </div>
          )
        })
      }
    </div>
  )
}

function Text(props) {
  return (
    <div className="text" style={{ whiteSpace: 'pre-wrap' }}>
    {props.lines.map((line, idx) => (
      <div className="textline" key={idx}>
      {line}
      {idx < props.lines.length - 1 && <br />}
      </div>
    ))}

    {(props.lines.length === 0 || props.lines[props.lines.length - 1] === '') ? (
      <>
      <br />
      <span className="radicals" style={{ textDecoration: 'underline' }}>
      {keysToRads(props.radicals)}
      </span>
      </>
    ) : (
      <span className="radicals" style={{ textDecoration: 'underline' }}>
      {keysToRads(props.radicals)}
      </span>
    )}
    </div>
  )
}

function getDescriptionFromChar(char) {
  const key = Object.keys(wakalitoDict).find(k => wakalitoDict[k] === char);
  return key ? wakalitoDesc[key] : '';
}

function LessonUI(props) {
  const commentLines = props.comments.split("\n")
  return (
    <div>
    <div className="comments">{
      commentLines.map((line, idx) => (
        <div key={idx}>
        {line}
        <br />
        </div>
      ))
    }</div>
    <br />
    <div className="question">
    {props.next ? (
      props.lesson === 16 ? (
        <>
        󱥄󱥠󱤉󱥂󱥁󱦝 {getDescriptionFromChar(props.next)}
        </>
      ) : (
        <>
        󱥄󱥠󱤉󱥂「<span className="blue">{props.ruby ? rubify(props.next) : props.next}</span>」
        </>
      )
    ) : (
      "󱥞󱥵󱤀"
    )}
    </div>
    </div>
  )
}

function TypingTest(props) {
  const words = Array.from(props.wordList) || [];
  const typedIndex = props.index;

  const gridRef = useRef(null);

  useEffect(() => {
    const line = Math.floor(typedIndex / 5);
    const lineHeight = gridRef.current?.firstChild?.offsetHeight || 0;
    const rowGap = 25
    const containerHeight = gridRef.current?.parentElement?.offsetHeight || 0;

    const scrollOffset = line * (lineHeight + rowGap) - containerHeight / 2 + lineHeight / 2;

    if (gridRef.current) {
      gridRef.current.style.transform = `translateY(-${scrollOffset}px)`;
    }
  }, [typedIndex]);

  return (
    <div className="typing-container">
      <div className="typing-grid" ref={gridRef}>
        {words.map((word, i) => (
          <span key={i} className={i < typedIndex ? "typed" : ""}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function getProgress(lesson) {
  const lessons = JSON.parse(localStorage.getItem('lessonProgress'))
  const total = lessons[lesson].flat().length
  const sum = lessons[lesson].map((ls, ind) => ls.length * ind).reduce((a, b) => a + b, 0)
  return sum / total / 3 * 100
}

function progressColor(progress) {
  const start = { r: 198, g: 0, b: 8 };     // #c60008
  const end = { r: 0, g: 198, b: 71 };      // #00c647
  const t = Math.max(0, Math.min(1, progress / 100)); // Clamp between 0 and 1

  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function App() {
  const [heldKey, setHeldKey] = useState(null);
  const [radicals, setRadicals] = useState(["", "", ""]);
  const [textField, setTextField] = useState(["", "", ""]);
  const [lines, setLines] = useState([])
  const [page, setPage] = useState(0)
  const [lesson, setLesson] = useState(0)

  if (!localStorage.getItem('lessonProgress')) {
    var dic = {}
    for (var l = 0; l < lessons.length; l++) {
      dic[l] = [Array.from(lessons[l]), [], [], []]
    }
    localStorage.setItem('lessonProgress', JSON.stringify(dic))
  }

  const [lessonProgress, setLessonProgress] = useState(JSON.parse(localStorage.getItem('lessonProgress')))
  const [lessonNextUp, setLessonNextUp] = useState("")
  const [lessonComments, setLessonComments] = useState("")
  const [questionsDone, setQuestionsDone] = useState(0)

  const [wordList, setWordList] = useState([])
  const [index, setIndex] = useState(0)
  const [wpm, setWPM] = useState(0)
  const [start, setStart] = useState(0)

  const [fade, setFade] = useState(true)
  const [ruby, setRuby] = useState(false)
  const [qwerty, setQWERTY] = useState(false)

  function incrementProg(character, increment) {
    setLessonProgress(prev => {
      const newProgress = JSON.parse(JSON.stringify(prev)); // ✅ deep copy

      const currentIndex = newProgress[lesson].findIndex(word => word.includes(character));

      if (currentIndex === -1) return prev;

      // Calculate new index with increment, clamp between 0 and 3
      const newIndex = Math.min(Math.max(currentIndex + increment, 0), 3);

      if (newIndex === currentIndex) return prev;

      newProgress[lesson][currentIndex] = newProgress[lesson][currentIndex].filter(ch => ch !== character);
      newProgress[lesson][newIndex].push(character);
      return newProgress;
    });
  }

  useEffect(() => {
    setLessonComments("")
  }, [lesson])

  useEffect(() => {
    if (!page) {
      const possible = lessonProgress[lesson].slice(0, -1).find(arr => arr.length > 0) || [];
      const index = Math.floor(Math.random() * possible.length);
      if (possible.length) {
        setLessonNextUp(possible[index])
      } else {
        setLessonNextUp(null)
        setLessonComments("󱥞󱤖‍󱥡󱥐󱤉󱥂󱥁󱦜󱥄󱥨󱤉󱤟󱥂󱤆")
      }
    }
  }, [page, questionsDone, lesson, lessonProgress])

  useEffect(() => {
    if (page === 1) {
      setStart(performance.now())
      setWordList(prev => {
        let newList = prev || [];

        while (newList.length < 50 + index) {
          const randomChar = words[Math.floor(Math.random() * words.length)];
          newList.push(randomChar);
        }

        return newList;
      });
    }
  }, [page, index]);

  useEffect(() => {
    localStorage.setItem('lessonProgress', JSON.stringify(lessonProgress))
  }, [lessonProgress])

  useEffect(() => {
    const handleKeyDown = (e) => {
      setHeldKey(e.key);

      if (e.key === "Backspace") {
        if (radicals[page]) {
          const newRadicals = [...radicals];
          newRadicals[page] = Array.from(newRadicals[page]).slice(0, -1).join('');
          setRadicals(newRadicals);
        } else {
          const newTextField = [...textField];
          newTextField[page] = Array.from(newTextField[page]).slice(0, -1).join('');
          setTextField(newTextField);
        }
      } else if (e.key === "Enter" || e.key === " ") {
        const character = radicals[page].toUpperCase();
        switch (page) {
          case 0:
            if (lessonNextUp) {
              if (character in wakalitoDict && wakalitoDict[character] === lessonNextUp) {
                setLessonComments("󱥵󱤀 ")
                incrementProg(lessonNextUp, 1) 
              } else {
                const keys = Object.keys(wakalitoDict).filter(key => wakalitoDict[key] === lessonNextUp)
                const rads = keys.map(key => `「${keysToRads(key)}」`).join("、")
                setLessonComments(`󱤍󱤀󱦜󱥞󱥷󱥠󱤉󱥂「${lessonNextUp}」󱤡󱥄󱤭󱤉󱥀󱥁󱦝\n${rads}`)
              }
              setQuestionsDone(prev => prev + 1)
            }
            setRadicals(prev => {
              prev[0] = ""
              return prev
            })
            break

          case 1:
            if (character in wakalitoDict && wakalitoDict[character] === wordList[index]) {
              setIndex(prev => prev + 1);
            }
            setRadicals(prev => {
              prev[1] = "";
              return prev;
            });
            break;

          case 2:
            if (e.key === "Enter" && !character) {
              const newTextField = [...textField];
              newTextField[page] += "\n";
              setTextField(newTextField);
            } else if (character in wakalitoDict) {
              const newTextField = [...textField];
              newTextField[page] += wakalitoDict[character];
              setTextField(newTextField);

              const newRadicals = [...radicals];
              newRadicals[page] = "";
              setRadicals(newRadicals);
            }
            break

          default:
            break
        }
      } else if ("123456qwertyasdfg".includes(e.key)) {
        const newRadicals = [...radicals];
        newRadicals[page] += e.key;
        setRadicals(newRadicals);
      }
    };

    const handleKeyUp = () => setHeldKey(null);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [radicals, textField, page, index, lessonNextUp, wordList]);

  useEffect(() => {
    setLines(textField[page].split("\n"));
  }, [textField, page]);

  useEffect(() => {
    const elapsedMinutes = (performance.now() - start) / 60000;
    setWPM(index / elapsedMinutes) 
  }, [index, start])

  const pages = ["󱥄󱤖‍󱥡", "󱥄󱥠󱤼󱤬󱥫󱤨", "󱥄󱥠󱤬󱥷󱥞"]
  const settingsNames = {
    ruby: {
      vari: ruby,
      func: setRuby,
      limit: 2,
      opt: "󱥄󱥠󱦐󱤡󱦜󱥞󱦝󱦑󱤬󱥚"
    },
    qwerty: {
      vari: qwerty,
      func: setQWERTY,
      limit: 2,
      opt: "󱤴󱥷󱤮󱤉󱤿󱥠QWERTY"
    }
  }

  return (
    <div className="App">
      <div className="navbar">
        <div className="pages">
          {
            pages.map(
              (pg, ind) => (
                <div 
                  onClick={() => {setFade(false); setTimeout(() => setPage(ind), 150); setTimeout(() => setFade(true), 150)}}
                  style={ind === page ? selectedStyle : {}}
                >{pg}</div>
              )
            )
          }
        </div>
        <div className="title">
          <div>󱥄󱤖󱥡󱤉󱤿󱥠󱦐󱥴󱦜󱤔󱦜󱤧󱦜󱥭󱦜󱦑</div>
        </div>
        <div className="settings">
          {
            Object.values(settingsNames).map(
              obj => (
                <div
                  onClick={() => {obj.func((obj.vari + 1) % obj.limit)}}
                  style={obj.vari ? selectedStyle : {}}
                >
                  {obj.opt}
                </div>
              )
            )
          }
        </div>
      </div>
      <Fade in={fade}>
        <div className="body">
          <div className="left">
            {page ? <Suggestions radicals={radicals[page]} ruby={ruby} /> : <Lessons lesson={lesson} setLesson={setLesson} />}
          </div>
          <div className="main">
            {
              [
                <LessonUI lesson={lesson} next={lessonNextUp} comments={lessonComments} ruby={ruby} />, 
                <TypingTest wordList={wordList} index={index} />, 
                null
              ][page]
            }
            <Text radicals={radicals[page]} lines={lines} />
            <br />
            <Keyboard pressed={heldKey} qwerty={qwerty} /> 
          </div>
          <div className="right">
            {
              page === 1 && (
                <div className="wpm">
                  <div>
                    󱤄󱦛󱤡、︁󱥞󱥠󱤉󱥂
                    <span className="number">󱥂<span className="blue">{numbers(index)}</span></span>
                  </div>
                  <div>
                    󱥫󱦂󱥳󱦛󱤡、︁󱥞󱥠󱤉󱥂
                    <span className="number">󱥂{numbers(Math.round(wpm))}</span>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </Fade>
    </div>
  );
}

export default App;
