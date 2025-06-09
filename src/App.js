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
  const kuliliList = "󱦡󱦠󱦣";

  const possible = Object.keys(wakalitoDict)
    .filter(a => {
      const matchesRadicals = a.toLowerCase().startsWith(props.radicals);
      const isInKuliliList = kuliliList.includes(wakalitoDict[a]);
      return props.kulili ? matchesRadicals : (matchesRadicals && !isInKuliliList);
    })
    .sort();

  const ndict = Object.assign({}, wakalitoDict, wakalitoDesc)

  return (
    <div>
      {
        possible && possible.map(a => (
          <div className="possibility-grid two-col" key={a}>
            <div> {props.ruby ? rubify(ndict[a]) : ndict[a]} </div>
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
              completed={getProgress(ind)/getTotal(ind)*100} 
              bgColor={progressColor(getProgress(ind)/getTotal(ind))} 
              customLabel={`󱥻${numbers(getTotal(ind))}󱤡${numbers(getProgress(ind))}`}
              height="15px"
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
            <button
              className={className} 
              onClick={() => {
                props.setRadicals(prev => {
                  let radicals = [...prev]
                  radicals[props.page] += qwerty[ind]
                  return radicals
                })
              }}
            >
              {key}
              <span className={cornerName}>{ind < 17 && props.qwerty ? qwerty[ind] : ""}</span>
            </button>
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
      {idx < props.lines.length - 1 ? <br /> : <span className="radicals" style={{ textDecoration: 'underline' }}>{keysToRads(props.radicals)}</span>}
      </div>
    ))}
    </div>
  )
}

function getDescriptionFromChar(char) {
  // find the keybind (e.g., 'A1') that maps to this character
  const keybind = Object.keys(wakalitoDict).find(key => wakalitoDict[key] === char);

  // if that keybind exists in the description dictionary, return the description
  return keybind && wakalitoDesc[keybind] ? wakalitoDesc[keybind] : char;
}

function isSpecial(word) {
  if (!word || word === "「") {
    return false
  }
  return word.startsWith("󱥐") || word.startsWith("󱥇") || word.startsWith("「");
}

function LessonUI(props) {
  const commentLines = props.comments.split("\n")
  const desc = getDescriptionFromChar(props.next)
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
        isSpecial(desc) ? (
          <>
          󱥄󱥠󱤉󱥂󱥁󱦝<span className="blue ruby-center">{desc}</span>
          </>
        ) : (
          <>
          󱥄󱥠󱤉󱥂「<span className="blue ruby-center">{props.ruby ? rubify(props.next) : props.next}</span>」
          </>
        )
      ) : (
        "󱥞󱥵󱤀"
      )}
      </div>
      <br />
      <div className="comments">󱥞󱥡󱦖󱥔󱤂󱤡󱥄󱤭󱤉󱥀「↵」</div>
      <br />
    </div>
  )
}

function TypingTest(props) {
  const words = Array.from(props.wordList) || [];
  const typedIndex = props.index;

  const gridRef = useRef(null);

  useEffect(() => {
    const paddingTop = 100
    const line = Math.floor(typedIndex / 5);
    const lineHeight = gridRef.current?.firstChild?.offsetHeight || 0;
    const rowGap = 25
    const containerHeight = gridRef.current?.parentElement?.offsetHeight || 0;

    const scrollOffset = line * (lineHeight + rowGap) - containerHeight / 2 + lineHeight / 2 + paddingTop;

    if (gridRef.current) {
      gridRef.current.style.transform = `translateY(-${scrollOffset}px)`;
    }
  }, [typedIndex, props.ruby]);

  return (
    <div className="typing-container">
      <div className="typing-grid" ref={gridRef}>
        {words.map((word, i) => (
          <span key={i} className={`${i < typedIndex ? 'typed' : ''} ruby-center`}>
            {props.ruby ? rubify(word) : word}
          </span>
        ))}
      </div>
    </div>
  );
}

function getProgress(lesson) {
  const lessons = JSON.parse(localStorage.getItem('lessonProgress'))
  return lessons[lesson].map((ls, ind) => ls.length * ind).reduce((a, b) => a + b, 0)
}

function getTotal(lesson) {
  const lessons = JSON.parse(localStorage.getItem('lessonProgress'))
  return lessons[lesson].flat().length * 3
}

function progressColor(progress) {
  const start = { r: 198, g: 0, b: 8 };     // #c60008
  const end = { r: 0, g: 198, b: 71 };      // #00c647
  const t = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function Main(props) {
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
  const [started, setStarted] = useState(false)
  const [start, setStart] = useState(0)

  const [fade, setFade] = useState(true)
  const [ruby, setRuby] = useState(false)
  const [qwerty, setQWERTY] = useState(true)
  const [kulili, setkulili] = useState(false)

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
        setLessonComments("󱥞󱤖‍󱥡󱥐󱤉󱥂󱥁󱦜󱥄󱥩󱤟󱥂󱤆")
      }
    }
  }, [page, questionsDone, lesson, lessonProgress])

  useEffect(() => {
    setWordList([])
  }, [kulili])

  useEffect(() => {
    if (page === 1) {
      setWordList(prev => {
        let newList = prev || [];

        while (newList.length < 50 + index) {
          const randomChar = words[Math.floor(Math.random() * words.length)];
          const kuliliList = "󱦡󱦠󱦣"

          if (kulili || !kuliliList.includes(randomChar)) {
            newList.push(randomChar)
          }
        }

        return newList;
      });
    }
  }, [page, index, kulili]);

  useEffect(() => {
    localStorage.setItem('lessonProgress', JSON.stringify(lessonProgress))
  }, [lessonProgress])

  useEffect(() => {
    const handleKeyDown = (e) => {
      setHeldKey(e.key);

      if (!started && page === 1) {
        setStarted(true)
        setStart(Date.now())
      }

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
                const rads = keys.map(key => `「${keysToRads(key)}」`).join("󱤇")
                const thisChar = isSpecial(getDescriptionFromChar(lessonNextUp)) ? `󱥠󱥁󱤡󱦝${getDescriptionFromChar(lessonNextUp)}` : `󱥂「${lessonNextUp}」󱤡`
                setLessonComments(`󱤍󱤀󱦜󱥞󱤭󱤉󱥀「${keysToRads(character)}」\n󱥞󱥷󱥠󱤉${thisChar}\n󱥄󱤭󱤉󱥀󱥁󱦝${rads}`)
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
    const elapsedMinutes = (Date.now() - start) / 60000;
    setWPM(index / elapsedMinutes) 
  }, [index, start])

  const pages = ["󱥄󱤖‍󱥡", "󱥄󱥠󱤼󱤬󱥫󱤨", "󱥄󱥠󱤬󱥷󱥞"]
  const settingsNames = {
    ruby: {
      vari: ruby,
      func: setRuby,
      limit: 2,
      opt: "󱤴󱥷󱤮󱤉󱥠󱦐󱤡󱦜󱥞󱦝󱦑"
    },
    qwerty: {
      vari: qwerty,
      func: setQWERTY,
      limit: 2,
      opt: "󱤴󱥷󱤮󱤉󱤿󱥠QWERTY"
    },
    kulili: {
      vari: kulili,
      func: setkulili,
      limit: 2,
      opt: "󱤴󱥷󱤮󱤉󱥂󱦈󱤨󱥹"
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
        <div className="settings">
          {
            Object.values(settingsNames).map(
              obj => (
                <div
                  onClick={() => {obj.func(prev => ((prev + 1) % obj.limit))}}
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
            {page ? <Suggestions radicals={radicals[page]} ruby={ruby} kulili={kulili} /> : <Lessons lesson={lesson} setLesson={setLesson} />}
          </div>
          <div className="main">
            {
              [
                <LessonUI lesson={lesson} next={lessonNextUp} comments={lessonComments} ruby={ruby} />, 
                <TypingTest wordList={wordList} index={index} ruby={ruby} />, 
                null
              ][page]
            }
            <br />
            <Text radicals={radicals[page]} lines={lines} />
            <br />
            <Keyboard pressed={heldKey} qwerty={qwerty} page={page} setRadicals={setRadicals} /> 
          </div>
          <div className="right">
            {
              page === 1 && (
                <div className="wpm">
                  <div>
                    󱤄󱤡󱥞󱥠󱤉
                    <span className="number">󱥂<span className="blue">{numbers(index)}</span></span>
                  </div>
                  <div>
                    󱥫󱥳󱥍󱦗󱥊󱥣󱦘󱤡󱥞󱥠󱤉
                    <span className="number">󱥂<span className="blue">{numbers(Math.round(wpm))}</span></span>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </Fade>
      <div className="footer">
        <div>
          <a 
            className="blue" 
            href="bsky.app/profile/tbdhk.xyz" 
            style={{textDecoration: "none"}}
          >󱤑󱦐󱥤󱦜󱥴󱦜󱦑</a>
          󱤧󱥉󱤉󱥁󱤙󱤿󱥍󱦗󱤟󱥂󱦘󱥧
          <a 
            className="blue" 
            href="https://www.reddit.com/r/tokipona/comments/1kms8gg/a_nonlatin_alphabetical_order_for_sitelen_pona/" 
            style={{textDecoration: "none"}}
          >󱥠󱥁</a>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isScreenBigEnough, setIsScreenBigEnough] = useState(true);

  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isBigEnough = w >= (4 / 3) * h || (w >= 1000 && h >= 1000);
      setIsScreenBigEnough(isBigEnough);
    };

    checkSize(); // initial check
    window.addEventListener("resize", checkSize); // respond to resizes

    return () => window.removeEventListener("resize", checkSize);
  }, []);

  if (!isScreenBigEnough) {
    return (
      <div style={{
        fontSize: "2rem",
        textAlign: "center",
        padding: "2rem"
      }}>
        󱤎󱤽󱥞󱤧󱤨󱦜󱥄󱤙󱤎󱤽󱥣<br />
        your screen is too small, please use a bigger one
      </div>
    );
  }

  return <Main />;
}

export default App;
