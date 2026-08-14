*Character* (abstracta)

 - #name, #passport, #face, #eyes, #yellowEyes, #mouth, #horns, #haveHorns, #hair, #phrase
 + get obtainName, obtainPassport, obtainFace, obtainEyes, obtainYellowEyes, obtainMouth, obtainHorns, obtainHaveHorns, obtainHair, obtainPhrase
 + dialogueLine(): string
 + specieLiar(): boolean  (base: siempre false)

--------------------------

*Human* extiende Character

 + specieLiar() no se sobreescribe (siempre false, heredado)

--------------------------

*Yokai* extiende Character

 - #yokaiType: string ("oni" | "kitsune" | "kappa")
 + specieLiar(): boolean  (sobreescrito: true si declara "humano" pero tiene cuernos, ojos amarillos o región "rio")

--------------------------

*Passport*

 - #name, #region, #declaredSpecie, #stamp
 + get obtainName, obtainRegion, obtainDeclaredSpecie, obtainStamp

--------------------------

*Rule*

 - #day, #property, #forbiddenValue, #description
 + getDay(), getProperty(), getForbiddenValue(), getDescription()
 + isViolated(character): boolean

--------------------------

*Day*

 - #number, #visitorGoal, #activeRules (Rule[]), #introMessage
 + getNumber(), getVisitorGoal(), getActiveRules(), getIntroMessage()
 + evaluateCharacter(character): Rule | null

--------------------------

*Game*

 - #dayNumber, #errors, #money, #maxErrors, #totalDays, #days (Day[]), #currentVisitor, #visitorsSeenToday, #todayProblematicSlots, #parts, #names, #phrases, #stamps, #species, #suspiciousPhrases, #playerName
 + loadData(onComplete): void
 + startNewGame(): void
 + get dayNumber, errors, money, currentVisitor, currentDay, playerName
 + decide(accept): void
 + isLost(): boolean
 + isWon(): boolean
 + loadProgress(): boolean

--------------------------

*Storage* (funciones sueltas, no es una clase)

 + saveCurrentGame(data), loadCurrentGame(), deleteCurrentGame()
 + saveToHistory(result), getHistory()
 + savePlayerName(name), loadPlayerName()
 + addCredits(name, amount), getAllCredits()

--------------------------

Relaciones:

Character <|-- Human
Character <|-- Yokai
Character o-- Passport        (composición: cada Character tiene su propio Passport)
Day o-- Rule[]                 (agregación: Day referencia reglas ya construidas)
Game o-- Day[]                 (Game arma los 7 días al cargar datos)
Game --> Character             (asociación: visitante actual)
Game ..> Human, Yokai          (dependencia: Game decide cuál instanciar)
Game ..> Storage                (dependencia: Game llama funciones, no las posee)
Rule.isViolated(character) ..> Character   (dependencia: recibe un Character como parámetro)
main.ts ..> Game                (dependencia: la interfaz orquesta a partir de Game)
