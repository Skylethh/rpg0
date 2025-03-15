import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import styles from '../styles/CharacterCreation.module.css';
import { initializeRuleBook } from '../data/sampleRuleData';

export default function CreateCharacter() {
  const router = useRouter();
  const rulebook = initializeRuleBook();
  const [step, setStep] = useState(1);

  const MAX_ABILITY_POINTS = 24;
  const [usedAbilityPoints, setUsedAbilityPoints] = useState(0);

  const [character, setCharacter] = useState({
    name: '',
    race: '',
    class: '',
    abilities: {
      strength: 8,
      dexterity: 8,
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8
    },
    skills: [],
    languages: [],
    background: '',
    equipment: [],
    cantrips: [], 
    spells: []
  });

  // Calculate if character is a spellcaster
  const isSpellcaster = () => {
    return ['bard', 'wizard', 'druid', 'paladin'].includes(character.class);
  };

  // Calculate total steps based on class
  const getTotalSteps = () => {
    return isSpellcaster() ? 5 : 4;
  };

  // Başlangıçta kullanılan puanları hesapla
  useEffect(() => {
    const initialPoints = Object.values(character.abilities).reduce(
      (total, value) => total + (value - 8),
      0
    );
    setUsedAbilityPoints(initialPoints);
  }, []);

  // Step labels for the progress indicator
  const steps = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Abilities' },
    { num: 3, label: 'Skills' },
    ...(isSpellcaster() ? [{ num: 4, label: 'Spells' }] : []),
    { num: getTotalSteps(), label: 'Finalize' }
  ];

  const updateCharacter = (field, value) => {
    setCharacter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAbility = (ability, value) => {
    // Önceki değeri al
    const currentValue = character.abilities[ability];
    
    // Yeni puan farkını hesapla
    const pointDifference = value - currentValue;
    
    // Yeni toplam kullanılan puanları hesapla
    const newTotalPoints = usedAbilityPoints + pointDifference;
    
    // Eğer toplam puan limitini aşıyorsa ve puan artırılıyorsa engelle
    if (newTotalPoints > MAX_ABILITY_POINTS && pointDifference > 0) {
      return;
    }
    
    // Değeri güncelle
    setCharacter(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [ability]: value
      }
    }));
    
    // Kullanılan puanları güncelle
    setUsedAbilityPoints(newTotalPoints);
  };

  const toggleLanguage = (language) => {
    setCharacter(prev => {
      if (prev.languages.includes(language)) {
        return {
          ...prev,
          languages: prev.languages.filter(lang => lang !== language)
        };
      } else {
        return {
          ...prev,
          languages: [...prev.languages, language]
        };
      }
    });
  };

  const nextStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => prev - 1);
  };

  const saveCharacter = () => {
    // Save character to local storage
    const savedCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
    const newCharacter = {
      ...character,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('characters', JSON.stringify([...savedCharacters, newCharacter]));
    router.push('/existing-characters');
  };

  // Calculate modifier from ability score
  const getModifier = (score) => {
    return Math.floor((score - 10) / 2);
  };

  // Format modifier with + or - sign
  const formatModifier = (mod) => {
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  // SpellSelection component with auto-selected cantrips and one level 1 spell
  const SpellSelection = ({ character, rulebook, updateCharacter }) => {
    const [selectedCantrips, setSelectedCantrips] = useState([]);
    const [selectedSpells, setSelectedSpells] = useState([]);
    
    // Get class data
    const classData = rulebook.classes.find(c => c.id === character.class);
    const className = classData?.name || '';
    
    // Filter spells by class using case-insensitive class name comparison
    const availableCantrips = rulebook.spells.filter(spell => {
      const isCorrectLevel = spell.level === 0;
      const matchesClass = spell.classes.some(spellClass => 
        spellClass.toLowerCase() === className?.toLowerCase()
      );
      
      console.log(`Spell ${spell.name}: level=${spell.level}, classes=${spell.classes}, matches=${matchesClass}`);
      
      return isCorrectLevel && matchesClass;
    });
    
    const availableLevel1Spells = rulebook.spells.filter(spell => {
      const isCorrectLevel = spell.level === 1;
      const matchesClass = spell.classes.some(spellClass => 
        spellClass.toLowerCase() === className?.toLowerCase()
      );
      
      return isCorrectLevel && matchesClass;
    });

    console.log(`Filtering spells for class: ${character.class} (${className})`);
console.log(`Available cantrips: ${availableCantrips.length}`);
console.log(`Available level 1 spells: ${availableLevel1Spells.length}`);

    // Console log to debug spell filtering
    console.log('Class name for filtering:', className);
    console.log('Available cantrips:', availableCantrips);
    console.log('Available level 1 spells:', availableLevel1Spells);

    // Get max spells by class
    const getMaxSpellsConfig = () => {
      switch(character.class) {
        case 'wizard':
          return { cantrips: 3, level1: 1 };
        case 'druid':
          return { cantrips: 2, level1: 1 };
        case 'bard':
          return { cantrips: 2, level1: 1 };
        case 'paladin':
          return { cantrips: 0, level1: 1 };
        default:
          return { cantrips: 0, level1: 0 };
      }
    };

    const maxSpells = getMaxSpellsConfig();
    
    // Auto-select cantrips on component mount
    useEffect(() => {
      console.log('SpellSelection component initialized');
      
      // If character already has cantrips selected, use those
      if (character.cantrips?.length > 0) {
        setSelectedCantrips(character.cantrips);
      } 
      // Otherwise automatically select cantrips
      else if (availableCantrips.length > 0) {
        // Select first available cantrips up to the class maximum
        const autoCantrips = availableCantrips
          .slice(0, maxSpells.cantrips)
          .map(spell => spell.id);
        
        setSelectedCantrips(autoCantrips);
        // Update character state with auto-selected cantrips
        updateCharacter('cantrips', autoCantrips);
      }
      
      // If character already has level 1 spells selected, use those
      if (character.spells?.length > 0) {
        setSelectedSpells(character.spells);
      }
    }, [character.class, availableCantrips.length]);
    
    // Toggle a level 1 spell (only allow 1 at a time)
    const toggleSpell = (spellId) => {
      console.log('Toggling spell:', spellId);
      
      if (selectedSpells.includes(spellId)) {
        // Deselect the spell
        const newSelection = selectedSpells.filter(id => id !== spellId);
        setSelectedSpells(newSelection);
        updateCharacter('spells', newSelection);
      } else {
        // Select the spell (replacing any previously selected one)
        const newSelection = [spellId];
        setSelectedSpells(newSelection);
        updateCharacter('spells', newSelection);
      }
    };
    
    return (
      <div className={styles.creatorStep}>
        <h2>Choose Your Spells</h2>
        <p>As a {className}, you have access to magical abilities.</p>
        
        {availableCantrips.length > 0 && (
          <div className={styles.spellsSection}>
            <h3>Cantrips (Level 0)</h3>
            <p>Cantrips are automatically selected for your character. These are minor spells you can cast at will.</p>
            
            <div className={styles.spellList}>
              {availableCantrips.slice(0, maxSpells.cantrips).map(spell => (
                <div 
                  key={spell.id} 
                  className={`${styles.spellCard} ${styles.selected} ${styles.autoSelected}`}
                >
                  <div className={styles.spellHeader}>
                    <h4>{spell.name}</h4>
                    <span className={styles.autoSelectedTag}>Auto-Selected</span>
                  </div>
                  <div className={styles.spellDetails}>
                    <p>{spell.school}</p>
                    <p>Casting Time: {spell.castingTime}</p>
                    <p>Range: {spell.range}</p>
                  </div>
                  <p className={styles.spellDescription}>
                    {spell.description.length > 100
                      ? `${spell.description.substring(0, 100)}...`
                      : spell.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {availableLevel1Spells.length > 0 && (
          <div className={styles.spellsSection}>
            <h3>Level 1 Spells</h3>
            <p>You can select 1 level 1 spell for your character.</p>
            <div className={styles.spellSelectionSummary}>
              Selected: {selectedSpells.length}/{maxSpells.level1}
            </div>
            
            <div className={styles.spellList}>
              {availableLevel1Spells.map(spell => {
                const isSelected = selectedSpells.includes(spell.id);
                
                return (
                  <div 
                    key={spell.id} 
                    className={`${styles.spellCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleSpell(spell.id)}
                  >
                    <div className={styles.spellHeader}>
                      <h4>{spell.name}</h4>
                      {spell.ritual && <span className={styles.ritualTag}>Ritual</span>}
                    </div>
                    <div className={styles.spellDetails}>
                      <p>{spell.school}</p>
                      <p>Casting Time: {spell.castingTime}</p>
                      <p>Range: {spell.range}</p>
                      {spell.concentration && <p className={styles.concentration}>Concentration</p>}
                    </div>
                    <p className={styles.spellDescription}>
                      {spell.description.length > 100
                        ? `${spell.description.substring(0, 100)}...`
                        : spell.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={prevStep}
            className={styles.buttonSecondary}
          >
            Back
          </button>
          <button 
            type="button" 
            className={styles.buttonPrimary}
            onClick={nextStep}
          >
            Next: Review Character
          </button>
        </div>
      </div>
    );
  };

  // Character summary for final review
  const renderCharacterSummary = () => {
    return (
      <div className={styles.creatorStep}>
        <h2>Character Summary</h2>
        <p>Review your character before finalizing.</p>
        
        <div className={styles.characterSummary}>
          <h3>{character.name}</h3>
          <div className={styles.characterType}>
            {rulebook.races.find(r => r.id === character.race)?.name} {rulebook.classes.find(c => c.id === character.class)?.name}
          </div>

          <h4 className={styles.sectionHeader}>Abilities</h4>
          <div className={styles.abilitiesSummary}>
            {/* First row: STR, DEX, CON */}
            {['strength', 'dexterity', 'constitution'].map(ability => {
              const raceBonus = rulebook.races.find(r => r.id === character.race)?.statBonuses[ability] || 0;
              const totalValue = character.abilities[ability] + raceBonus;
              
              return (
                <div key={ability} className={styles.abilitySummaryItem}>
                  <div className={styles.abilityName}>{ability.substr(0, 3).toUpperCase()}</div>
                  <div className={styles.abilityValue}>
                    <div className={styles.abilityTotal}>{totalValue}</div>
                    <div className={styles.abilityDetails}>
                      {character.abilities[ability]} 
                      {raceBonus > 0 && <span className={styles.racialBonus}>+{raceBonus}</span>}
                    </div>
                  </div>
                  <div className={styles.abilityMod}>
                    <span className={styles.modifierLabel}>MOD</span>
                    <span className={styles.modifierValue}>{formatModifier(getModifier(totalValue))}</span>
                  </div>
                </div>
              );
            })}
            
            {/* Second row: INT, WIS, CHA */}
            {['intelligence', 'wisdom', 'charisma'].map(ability => {
              const raceBonus = rulebook.races.find(r => r.id === character.race)?.statBonuses[ability] || 0;
              const totalValue = character.abilities[ability] + raceBonus;
              
              return (
                <div key={ability} className={styles.abilitySummaryItem}>
                  <div className={styles.abilityName}>{ability.substr(0, 3).toUpperCase()}</div>
                  <div className={styles.abilityValue}>
                    <div className={styles.abilityTotal}>{totalValue}</div>
                    <div className={styles.abilityDetails}>
                      {character.abilities[ability]} 
                      {raceBonus > 0 && <span className={styles.racialBonus}>+{raceBonus}</span>}
                    </div>
                  </div>
                  <div className={styles.abilityMod}>
                    <span className={styles.modifierLabel}>MOD</span>
                    <span className={styles.modifierValue}>{formatModifier(getModifier(totalValue))}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <h4 className={styles.sectionHeader}>Racial Traits</h4>
          <ul className={styles.traitsList}>
            {rulebook.races.find(r => r.id === character.race)?.traits.map(trait => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
          
          <h4 className={styles.sectionHeader}>Racial Abilities</h4>
          <ul className={styles.abilitiesList}>
            {rulebook.races.find(r => r.id === character.race)?.abilities.map(ability => (
              <li key={ability.name}>
                <strong>{ability.name}:</strong> {ability.description}
              </li>
            ))}
          </ul>
          
          {/* Add spell section if character has spells */}
          {isSpellcaster() && (character.cantrips?.length > 0 || character.spells?.length > 0) && (
            <>
              <h4 className={styles.sectionHeader}>Spellcasting</h4>
              
              {character.cantrips?.length > 0 && (
                <>
                  <h5 className={styles.spellsSubheader}>Cantrips</h5>
                  <ul className={styles.spellsList}>
                    {character.cantrips.map(spellId => {
                      const spell = rulebook.spells.find(s => s.id === spellId);
                      return spell ? (
                        <li key={spellId} className={styles.spellItem}>
                          <span className={styles.spellName}>{spell.name}</span>
                          <span className={styles.spellMeta}>{spell.school}, {spell.castingTime}, {spell.range}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </>
              )}
              
              {character.spells?.length > 0 && (
                <>
                  <h5 className={styles.spellsSubheader}>Level 1 Spells</h5>
                  <ul className={styles.spellsList}>
                    {character.spells.map(spellId => {
                      const spell = rulebook.spells.find(s => s.id === spellId);
                      return spell ? (
                        <li key={spellId} className={styles.spellItem}>
                          <span className={styles.spellName}>{spell.name}</span>
                          <span className={styles.spellMeta}>
                            {spell.school}
                            {spell.ritual ? ' (Ritual)' : ''}, 
                            {spell.concentration ? ' Concentration, ' : ' '}
                            {spell.duration}
                          </span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </>
              )}
            </>
          )}
          
          <h4 className={styles.sectionHeader}>Languages</h4>
          <ul className={styles.languagesList}>
            {character.languages.map(langId => (
              <li key={langId}>
                {rulebook.languages.find(l => l.id === langId)?.name}
              </li>
            ))}
          </ul>
          
          {character.background && (
            <>
              <h4 className={styles.sectionHeader}>Background</h4>
              <p className={styles.backgroundText}>{character.background}</p>
            </>
          )}
        </div>
        
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={prevStep}
            className={styles.buttonSecondary}
          >
            Back
          </button>
          <button
            type="button"
            onClick={saveCharacter}
            className={styles.buttonPrimary}
          >
            Create Character
          </button>
        </div>
      </div>
    );
  };

  // Render the step content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.creatorStep}>
            <h2>Character Basics</h2>
            <p>Begin your journey by choosing your character's name, race, and class.</p>
            
            <div className={styles.formGroup}>
              <label htmlFor="name">Character Name</label>
              <input
                type="text"
                id="name"
                value={character.name}
                onChange={(e) => updateCharacter('name', e.target.value)}
                placeholder="Enter your character's name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="race">Race</label>
              <select
                id="race"
                value={character.race}
                onChange={(e) => updateCharacter('race', e.target.value)}
                required
              >
                <option value="">Select a race</option>
                {rulebook.races.map(race => (
                  <option key={race.id} value={race.id}>{race.name}</option>
                ))}
              </select>
            </div>

            {character.race && (
              <div className={styles.infoCard}>
                <h3>{rulebook.races.find(r => r.id === character.race)?.name}</h3>
                <p>{rulebook.races.find(r => r.id === character.race)?.description}</p>
                
                <h4>Racial Traits</h4>
                <ul>
                  {rulebook.races.find(r => r.id === character.race)?.traits.map(trait => (
                    <li key={trait}>{trait}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="class">Class</label>
              <select
                id="class"
                value={character.class}
                onChange={(e) => updateCharacter('class', e.target.value)}
                required
              >
                <option value="">Select a class</option>
                {rulebook.classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {character.class && (
              <div className={styles.infoCard}>
                <h3>{rulebook.classes.find(c => c.id === character.class)?.name}</h3>
                <p>{rulebook.classes.find(c => c.id === character.class)?.description}</p>
                
                <h4>Class Features</h4>
                <ul>
                  {rulebook.classes.find(c => c.id === character.class)?.features.map(feature => (
                    <li key={feature.name}>
                      <strong>{feature.name}:</strong> {feature.description}
                    </li>
                  ))}
                </ul>
                
                {isSpellcaster() && (
                  <div className={styles.spellcasterNote}>
                    <h4>Spellcasting</h4>
                    <p>As a {rulebook.classes.find(c => c.id === character.class)?.name}, you have the ability to cast spells. You will be able to select your spells after setting up your character's abilities and skills.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => router.back()}
                className={styles.buttonSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={nextStep}
                className={styles.buttonPrimary}
                disabled={!character.name || !character.race || !character.class}
              >
                Next: Abilities
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className={styles.creatorStep}>
            <h2>Ability Scores</h2>
            <p>Distribute your character's ability scores. Starting from 8, you can increase each ability up to 15.</p>
            
            <div className={styles.pointsIndicator}>
              <div className={styles.pointsLabel}>
                Available Points: <span className={styles.pointsValue}>{MAX_ABILITY_POINTS - usedAbilityPoints}</span>/{MAX_ABILITY_POINTS}
              </div>
              <div className={styles.pointsBar}>
                <div 
                  className={styles.pointsFill} 
                  style={{ width: `${(usedAbilityPoints / MAX_ABILITY_POINTS) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className={styles.abilitiesGrid}>
              {Object.keys(character.abilities).map(ability => (
                <div key={ability} className={styles.abilityItem}>
                  <label htmlFor={ability}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </label>
                  <div className={styles.abilityControls}>
                    <button
                      type="button"
                      onClick={() => updateAbility(ability, Math.max(3, character.abilities[ability] - 1))}
                      disabled={character.abilities[ability] <= 3}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id={ability}
                      value={character.abilities[ability]}
                      onChange={(e) => updateAbility(ability, Math.max(3, Math.min(15, parseInt(e.target.value) || 0)))}
                      min="3"
                      max="15"
                    />
                    <button
                      type="button"
                      onClick={() => updateAbility(ability, Math.min(15, character.abilities[ability] + 1))}
                      disabled={character.abilities[ability] >= 15 || usedAbilityPoints >= MAX_ABILITY_POINTS}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.abilityModifier}>
                    Modifier: {formatModifier(getModifier(character.abilities[ability]))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={prevStep}
                className={styles.buttonSecondary}
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className={styles.buttonPrimary}
              >
                Next: Skills & Languages
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className={styles.creatorStep}>
            <h2>Skills & Languages</h2>
            <p>Choose the languages your character knows and specify any background details.</p>
            
            <div className={styles.formGroup}>
              <label>Languages</label>
              <div className={styles.languagesGrid}>
                {rulebook.languages.map(language => (
                  <div key={language.id} className={styles.languageItem}>
                    <input
                      type="checkbox"
                      id={`lang-${language.id}`}
                      checked={character.languages.includes(language.id)}
                      onChange={() => toggleLanguage(language.id)}
                    />
                    <label htmlFor={`lang-${language.id}`}>{language.name}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="background">Character Background</label>
              <textarea
                id="background"
                value={character.background}
                onChange={(e) => updateCharacter('background', e.target.value)}
                rows="4"
                placeholder="Describe your character's background and history..."
              ></textarea>
            </div>
              
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={prevStep}
                className={styles.buttonSecondary}
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className={styles.buttonPrimary}
              >
                Next: {isSpellcaster() ? "Spells" : "Review Character"}
              </button>
            </div>
          </div>
        );
      
      case 4:
        // If spellcaster, show spell selection, otherwise show character summary
        return isSpellcaster() ? (
          <SpellSelection
            character={character}
            rulebook={rulebook}
            updateCharacter={updateCharacter}
          />
        ) : renderCharacterSummary();
      
      case 5:
        // Final step with character summary
        return renderCharacterSummary();
      
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Head>
        <title>Create Character | DragonQuestAI</title>
        <meta name="description" content="Create your character for your next adventure" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.creatorHeader}>
          <h1 className={styles.title}>Forge Your Legend</h1>
          <p className={styles.subtitle}>Create a character to begin your adventure</p>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.stepsProgress}>
          {steps.map(s => (
            <div
              key={s.num}
              className={`${styles.step} ${step === s.num ? styles.active : ''} ${step > s.num ? styles.completed : ''}`}
              data-label={s.label}
            >
              {step > s.num ? '✓' : s.num}
            </div>
          ))}
        </div>
        
        <div className={styles.creatorContent}>
          {renderStepContent()}
        </div>
      </div>
    </Layout>
  );
}