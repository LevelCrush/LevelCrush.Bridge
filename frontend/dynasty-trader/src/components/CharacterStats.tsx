import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { characterService } from '@/services/character';
import { Character, CharacterStats as StatsType } from '@/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import {
  HeartIcon,
  SparklesIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  MapPinIcon,
  FireIcon,
  ShieldCheckIcon,
  BeakerIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

interface CharacterStatsProps {
  character: Character;
}

export default function CharacterStats({ character }: CharacterStatsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'progression'>('overview');

  // Fetch detailed stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['character', character.id, 'stats'],
    queryFn: () => characterService.getCharacterStats(character.id),
    enabled: !!character.id,
  });

  // Calculate derived stats
  const derivedStats = useMemo(() => {
    if (!stats) return null;

    const age = Math.floor(
      (new Date().getTime() - new Date(character.birth_date).getTime()) / 
      (1000 * 60 * 60 * 24 * 365)
    );

    const lifeExpectancy = 60 + Math.floor(character.luck / 10) + Math.floor(character.health / 20);
    const remainingYears = Math.max(0, lifeExpectancy - age);
    const lifeProgress = (age / lifeExpectancy) * 100;

    // Calculate skill bonuses
    const tradingBonus = (stats.trading_bonus || 0) * 100;
    const negotiationBonus = Math.floor(character.charisma / 10) * 5;
    const analysisBonus = Math.floor(character.intelligence / 10) * 3;
    const luckBonus = Math.floor(character.luck / 10) * 2;

    // Calculate stamina regeneration
    const staminaRegen = 5 + Math.floor(character.health / 20);

    return {
      age,
      lifeExpectancy,
      remainingYears,
      lifeProgress,
      tradingBonus,
      negotiationBonus,
      analysisBonus,
      luckBonus,
      staminaRegen,
      totalBonuses: tradingBonus + negotiationBonus + analysisBonus + luckBonus,
    };
  }, [character, stats]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    const maxStat = 100;
    return [
      {
        stat: 'Health',
        value: character.health,
        fullMark: maxStat,
        icon: '❤️'
      },
      {
        stat: 'Stamina',
        value: character.stamina,
        fullMark: maxStat,
        icon: '⚡'
      },
      {
        stat: 'Charisma',
        value: character.charisma,
        fullMark: maxStat,
        icon: '💬'
      },
      {
        stat: 'Intelligence',
        value: character.intelligence,
        fullMark: maxStat,
        icon: '🧠'
      },
      {
        stat: 'Luck',
        value: character.luck,
        fullMark: maxStat,
        icon: '🍀'
      }
    ];
  }, [character]);

  // Prepare skills data
  const skillsData = useMemo(() => {
    if (!derivedStats) return [];
    
    return [
      {
        skill: 'Trading',
        value: derivedStats.tradingBonus,
        color: '#F59E0B'
      },
      {
        skill: 'Negotiation',
        value: derivedStats.negotiationBonus,
        color: '#10B981'
      },
      {
        skill: 'Analysis',
        value: derivedStats.analysisBonus,
        color: '#3B82F6'
      },
      {
        skill: 'Fortune',
        value: derivedStats.luckBonus,
        color: '#8B5CF6'
      }
    ];
  }, [derivedStats]);

  const getStatColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatBar = (value: number, max: number = 100, color?: string) => {
    const percentage = (value / max) * 100;
    const barColor = color || (percentage >= 80 ? 'bg-green-500' : 
                              percentage >= 60 ? 'bg-yellow-500' : 
                              percentage >= 40 ? 'bg-orange-500' : 'bg-red-500');
    
    return (
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Character Statistics</h3>
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  if (!character.is_alive) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">💀</span>
          <h3 className="text-lg font-medium text-white">Character Deceased</h3>
          <p className="mt-2 text-sm text-slate-400">
            {character.name} died at age {derivedStats?.age || 'unknown'} from {character.death_cause || 'unknown causes'}
          </p>
          <div className="mt-4 text-sm text-slate-500">
            <p>Born: {new Date(character.birth_date).toLocaleDateString()}</p>
            {character.death_date && (
              <p>Died: {new Date(character.death_date).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-4">Character Statistics</h3>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'skills', label: 'Skills & Bonuses', icon: StarIcon },
            { id: 'progression', label: 'Life Progress', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-dynasty-500 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Primary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: 'Health',
                value: character.health,
                max: character.max_health || 100,
                icon: HeartIcon,
                color: getStatColor(character.health)
              },
              {
                label: 'Stamina',
                value: character.stamina,
                max: character.max_stamina || 100,
                icon: BoltIcon,
                color: getStatColor(character.stamina)
              },
              {
                label: 'Charisma',
                value: character.charisma,
                max: 100,
                icon: ChatBubbleLeftRightIcon,
                color: getStatColor(character.charisma)
              },
              {
                label: 'Intelligence',
                value: character.intelligence,
                max: 100,
                icon: AcademicCapIcon,
                color: getStatColor(character.intelligence)
              }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm font-medium text-white">{stat.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${stat.color}`}>
                    {stat.value}/{stat.max}
                  </span>
                </div>
                {getStatBar(stat.value, stat.max)}
                {stat.label === 'Stamina' && derivedStats && (
                  <p className="text-xs text-slate-400 mt-1">
                    Regenerates {derivedStats.staminaRegen} per hour
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Luck and Wealth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍀</span>
                  <span className="text-sm font-medium text-white">Luck</span>
                </div>
                <span className={`text-lg font-bold ${getStatColor(character.luck)}`}>
                  {character.luck}/100
                </span>
              </div>
              {getStatBar(character.luck)}
              <p className="text-xs text-slate-400 mt-1">
                +{derivedStats?.luckBonus || 0}% to all random events
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-dynasty-400" />
                  <span className="text-sm font-medium text-white">Wealth</span>
                </div>
                <span className="text-lg font-bold text-dynasty-400">
                  {parseFloat(stats?.wealth || character.wealth || '0').toLocaleString()}
                </span>
              </div>
              {character.inheritance_received && parseFloat(character.inheritance_received) > 0 && (
                <p className="text-xs text-slate-400">
                  Includes {parseFloat(character.inheritance_received).toLocaleString()} gold inheritance
                </p>
              )}
            </div>
          </div>

          {/* Stats Radar Chart */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-4">Attribute Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#475569" />
                  <PolarAngleAxis 
                    dataKey="stat" 
                    tick={{ fill: '#CBD5E1', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#CBD5E1', fontSize: 10 }}
                  />
                  <Radar 
                    name="Stats" 
                    dataKey="value" 
                    stroke="#B45FFF" 
                    fill="#B45FFF" 
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && derivedStats && (
        <div className="space-y-6">
          {/* Total Bonuses */}
          <div className="bg-gradient-to-r from-dynasty-600 to-dynasty-700 rounded-lg p-6 text-center">
            <TrophyIcon className="h-12 w-12 text-dynasty-300 mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white">
              +{derivedStats.totalBonuses.toFixed(1)}%
            </h4>
            <p className="text-dynasty-200">Total Skill Bonuses</p>
          </div>

          {/* Individual Skills */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-4">Skill Breakdown</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillsData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="skill" tick={{ fill: '#CBD5E1' }} />
                  <YAxis tick={{ fill: '#CBD5E1' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#CBD5E1' }}
                    formatter={(value: number) => `+${value.toFixed(1)}%`}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {skillsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CurrencyDollarIcon className="h-5 w-5 text-orange-400" />
                <h5 className="font-medium text-white">Trading Mastery</h5>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400">
                  Base Trading Bonus: <span className="text-orange-400 font-medium">+{derivedStats.tradingBonus.toFixed(1)}%</span>
                </p>
                <p className="text-xs text-slate-500">
                  Reduces market fees and improves sell prices
                </p>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-400" />
                <h5 className="font-medium text-white">Negotiation Skills</h5>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400">
                  Charisma Bonus: <span className="text-green-400 font-medium">+{derivedStats.negotiationBonus}%</span>
                </p>
                <p className="text-xs text-slate-500">
                  Better prices when dealing with other traders
                </p>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BeakerIcon className="h-5 w-5 text-blue-400" />
                <h5 className="font-medium text-white">Market Analysis</h5>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400">
                  Intelligence Bonus: <span className="text-blue-400 font-medium">+{derivedStats.analysisBonus}%</span>
                </p>
                <p className="text-xs text-slate-500">
                  Better prediction of market trends
                </p>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🍀</span>
                <h5 className="font-medium text-white">Fortune's Favor</h5>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400">
                  Luck Bonus: <span className="text-purple-400 font-medium">+{derivedStats.luckBonus}%</span>
                </p>
                <p className="text-xs text-slate-500">
                  Chance for bonus rewards and rare finds
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Life Progress Tab */}
      {activeTab === 'progression' && derivedStats && (
        <div className="space-y-6">
          {/* Age and Life Expectancy */}
          <div className="bg-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-white">Life Journey</h4>
                <p className="text-sm text-slate-400">
                  Age {derivedStats.age} of expected {derivedStats.lifeExpectancy} years
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-slate-400" />
            </div>

            <div className="mb-2">
              {getStatBar(derivedStats.age, derivedStats.lifeExpectancy, 
                derivedStats.lifeProgress < 50 ? 'bg-green-500' :
                derivedStats.lifeProgress < 75 ? 'bg-yellow-500' :
                derivedStats.lifeProgress < 90 ? 'bg-orange-500' : 'bg-red-500'
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mt-4">
              <div>
                <p className="text-2xl font-bold text-white">{derivedStats.age}</p>
                <p className="text-xs text-slate-400">Years Lived</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-dynasty-400">{derivedStats.remainingYears}</p>
                <p className="text-xs text-slate-400">Years Remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{derivedStats.lifeProgress.toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Life Progress</p>
              </div>
            </div>
          </div>

          {/* Life Stages */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-4">Life Stages</h4>
            <div className="space-y-3">
              {[
                { stage: 'Youth', range: '0-20', icon: '👶', active: derivedStats.age <= 20 },
                { stage: 'Prime', range: '21-40', icon: '💪', active: derivedStats.age > 20 && derivedStats.age <= 40 },
                { stage: 'Mature', range: '41-60', icon: '🧔', active: derivedStats.age > 40 && derivedStats.age <= 60 },
                { stage: 'Elder', range: '60+', icon: '👴', active: derivedStats.age > 60 }
              ].map((stage) => (
                <div 
                  key={stage.stage}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                    stage.active ? "bg-dynasty-600 border border-dynasty-500" : "bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stage.icon}</span>
                    <div>
                      <p className={cn(
                        "font-medium",
                        stage.active ? "text-white" : "text-slate-400"
                      )}>
                        {stage.stage}
                      </p>
                      <p className="text-xs text-slate-500">Ages {stage.range}</p>
                    </div>
                  </div>
                  {stage.active && (
                    <span className="text-xs bg-dynasty-700 text-dynasty-200 px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generation Info */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Dynasty Generation</h4>
                <p className="text-2xl font-bold text-dynasty-400 mt-1">
                  Generation {character.generation}
                </p>
              </div>
              <FireIcon className="h-8 w-8 text-dynasty-400" />
            </div>
            {character.parent_character_id && (
              <p className="text-xs text-slate-400 mt-2">
                Descendant of a proud trading lineage
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}