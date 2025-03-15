import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import styles from '../styles/ExistingCharacters.module.css';
import { initializeRuleBook } from '../data/sampleRuleData';

export default function ExistingCharacters() {
  const router = useRouter();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const rulebook = initializeRuleBook();

  // Load characters from local storage
  useEffect(() => {
    const loadCharacters = () => {
      try {
        const savedCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
        setCharacters(savedCharacters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        console.error('Error loading characters:', error);
        setCharacters([]);
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

  const handleViewDetails = (character) => {
    setSelectedCharacter(character);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      const updatedCharacters = characters.filter(character => character.id !== id);
      localStorage.setItem('characters', JSON.stringify(updatedCharacters));
      setCharacters(updatedCharacters);
      
      if (selectedCharacter?.id === id) {
        setShowModal(false);
      }
    }
  };

  const handleEditCharacter = (id) => {
    router.push(`/edit-character/${id}`);
  };

  const handleStartGame = (id) => {
    router.push(`/game?character=${id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate modifier from ability score
  const getModifier = (score) => {
    return Math.floor((score - 10) / 2);
  };

  // Format modifier with + or - sign
  const formatModifier = (mod) => {
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  // Check if character is a spellcaster
  const isSpellcaster = (characterClass) => {
    return ['bard', 'wizard', 'druid', 'paladin'].includes(characterClass);
  };

  return (
    <Layout>
      <Head>
        <title>Your Characters | DragonQuestAI</title>
        <meta name="description" content="Manage your existing characters" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Characters</h1>
          <div className={styles.divider}></div>
          <p className={styles.subtitle}>Manage your existing characters and continue your adventures</p>
        </div>
        
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingIcon}></div>
            <p>Loading your characters...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className={styles.noCharacters}>
            <p className={styles.noCharactersText}>
              You haven't created any characters yet. Create your first character to begin your adventure!
            </p>
            <button 
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={() => router.push('/create-character')}
            >
              Create Your First Character
            </button>
          </div>
        ) : (
          <>
            <div className={styles.charactersList}>
              {characters.map(character => (
                <div className={styles.characterCard} key={character.id}>
                  <div className={styles.characterHeader}>
                    <h2 className={styles.characterName}>{character.name}</h2>
                  </div>
                  
                  <div className={styles.characterInfo}>
                    <div className={styles.characterDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Race:</span>
                        <span className={styles.detailValue}>
                          {rulebook.races.find(r => r.id === character.race)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Class:</span>
                        <span className={styles.detailValue}>
                          {rulebook.classes.find(c => c.id === character.class)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Created:</span>
                        <span className={styles.detailValue}>
                          {formatDate(character.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.characterActions}>
                    <button 
                      className={`${styles.button} ${styles.secondaryButton}`}
                      onClick={() => handleViewDetails(character)}
                    >
                      View Details
                    </button>
                    <button 
                      className={`${styles.button} ${styles.primaryButton}`}
                      onClick={() => handleStartGame(character.id)}
                    >
                      Play
                    </button>
                    <button 
                      className={`${styles.button} ${styles.dangerButton} ${styles.deleteAction}`}
                      onClick={() => handleDelete(character.id)}
                    >
                      Delete Character
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.createNew}>
              <button 
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={() => router.push('/create-character')}
              >
                Create New Character
              </button>
            </div>
          </>
        )}
      </div>
      
      {showModal && selectedCharacter && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedCharacter.name}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.characterSummary}>
              <div className={styles.characterType}>
                {rulebook.races.find(r => r.id === selectedCharacter.race)?.name || 'Unknown'} {' '}
                {rulebook.classes.find(c => c.id === selectedCharacter.class)?.name || 'Unknown'}
              </div>
              
              <h3 className={styles.sectionHeader}>Abilities</h3>
              <div className={styles.abilitiesSummary}>
                {Object.entries(selectedCharacter.abilities).map(([ability, value]) => {
                  const raceBonus = rulebook.races.find(r => r.id === selectedCharacter.race)?.statBonuses[ability] || 0;
                  const totalValue = value + raceBonus;
                  const modifier = getModifier(totalValue);
                  
                  return (
                    <div key={ability} className={styles.abilitySummaryItem}>
                      <div className={styles.abilityName}>
                        {ability.substr(0, 3).toUpperCase()}
                      </div>
                      <div className={styles.abilityValue}>
                        <div className={styles.abilityTotal}>{totalValue}</div>
                        <div className={styles.abilityDetails}>
                          {value} 
                          {raceBonus > 0 && (
                            <span className={styles.racialBonus}>+{raceBonus}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.abilityMod}>
                        <span className={styles.modifierLabel}>MOD</span>
                        <span className={styles.modifierValue}>
                          {formatModifier(modifier)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <h3 className={styles.sectionHeader}>Racial Traits</h3>
              <ul className={styles.traitsList}>
                {rulebook.races.find(r => r.id === selectedCharacter.race)?.traits.map(trait => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>
              
              <h3 className={styles.sectionHeader}>Racial Abilities</h3>
              <ul className={styles.abilitiesList}>
                {rulebook.races.find(r => r.id === selectedCharacter.race)?.abilities.map(ability => (
                  <li key={ability.name}>
                    <strong>{ability.name}:</strong> {ability.description}
                  </li>
                ))}
              </ul>
              
              {/* Spellcasting Section (NEW) */}
              {isSpellcaster(selectedCharacter.class) && 
                (selectedCharacter.cantrips?.length > 0 || selectedCharacter.spells?.length > 0) && (
                <div>
                  <h3 className={styles.sectionHeader}>Spellcasting</h3>
                  
                  {selectedCharacter.cantrips?.length > 0 && (
                    <div>
                      <h4 className={styles.spellsSubheader}>Cantrips</h4>
                      <ul className={styles.spellsList}>
                        {selectedCharacter.cantrips.map(spellId => {
                          const spell = rulebook.spells.find(s => s.id === spellId);
                          return spell ? (
                            <li key={spellId} className={styles.spellItem}>
                              <span className={styles.spellName}>{spell.name}</span>
                              <span className={styles.spellMeta}>
                                {spell.school}, {spell.castingTime}, {spell.range}
                              </span>
                            </li>
                          ) : (
                            <li key={spellId} className={styles.spellItem}>Unknown Spell ({spellId})</li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {selectedCharacter.spells?.length > 0 && (
                    <div>
                      <h4 className={styles.spellsSubheader}>Level 1 Spells</h4>
                      <ul className={styles.spellsList}>
                        {selectedCharacter.spells.map(spellId => {
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
                          ) : (
                            <li key={spellId} className={styles.spellItem}>Unknown Spell ({spellId})</li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <h3 className={styles.sectionHeader}>Languages</h3>
              <ul className={styles.languagesList}>
                {selectedCharacter.languages?.map(langId => (
                  <li key={langId}>
                    {rulebook.languages.find(l => l.id === langId)?.name || 'Unknown Language'}
                  </li>
                ))}
              </ul>
              
              {selectedCharacter.background && (
                <>
                  <h3 className={styles.sectionHeader}>Background</h3>
                  <p className={styles.backgroundText}>{selectedCharacter.background}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}