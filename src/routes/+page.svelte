
<script>
  import { fly, fade } from 'svelte/transition';
  
  const games = [
    {
      id: 'mindsync',
      title: 'MindSync',
      description: 'Test your memory and pattern recognition in this engaging brain training game',
      color: 'from-purple-500 to-indigo-600',
      icon: '🧠',
      href: '/MindSync'
    },
    {
      id: 'colordash',
      title: 'Color Dash',
      description: 'Quick reflexes meet color matching in this fast-paced challenge',
      color: 'from-red-500 to-orange-500',
      icon: '🎨',
      href: '/colordash'
    },
    {
      id: 'hexamerge',
      title: 'HexaMerge',
      description: 'Strategic merging puzzle with hexagonal tiles for endless fun',
      color: 'from-emerald-500 to-teal-600',
      icon: '⬡',
      href: '/hexamerge'
    },
    {
      id: 'mindgrid',
      title: 'MindGrid',
      description: 'Match tiles and multiply scores in this addictive grid-based puzzle',
      color: 'from-blue-500 to-cyan-500',
      icon: '🎯',
      href: '/mindgrid'
    }
  ];
</script>

<svelte:head>
  <title>Free Online Brain Games & Puzzles | LostMatches.com</title>
  <meta name="description" content="Play free online brain training games and puzzles. Challenge yourself with memory games, pattern recognition, and strategic thinking. No downloads required, play instantly in your browser!" />
  <meta name="keywords" content="free online games, brain training, puzzle games, memory games, browser games, mind games" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Free Online Brain Games & Puzzles | LostMatches.com" />
  <meta property="og:description" content="Play free online brain training games and puzzles. Challenge yourself with memory games, pattern recognition, and strategic thinking." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://lostmatches.com" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Free Online Brain Games & Puzzles" />
  <meta name="twitter:description" content="Challenge your mind with our collection of free brain training games and puzzles." />
</svelte:head>

<main class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <section class="relative overflow-hidden bg-white"
           in:fly={{ y: 20, duration: 700, delay: 200 }}>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          Challenge Your Mind with
          <span class="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Free Brain Games
          </span>
        </h1>
        <p class="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-8">
          Train your brain with our collection of engaging puzzle games. Play instantly in your browser, no downloads required.
        </p>
        <a href="#games"
           class="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200">
          Play Now
        </a>
      </div>
    </div>
    
    <!-- Decorative background -->
    <div class="absolute inset-0 -z-10 opacity-[0.02]" aria-hidden="true">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {#each ['Free Forever', 'Play Instantly', 'Brain Training'] as feature, i}
          <div class="bg-white p-6 rounded-2xl shadow-sm"
               in:fly={{ y: 20, duration: 700, delay: 300 + i * 100 }}>
            <div class="text-xl font-semibold mb-2">{feature}</div>
            <p class="text-gray-600">
              {#if feature === 'Free Forever'}
                All our games are completely free to play. No hidden costs or subscriptions.
              {:else if feature === 'Play Instantly'}
                Start playing right away in your browser. No downloads or installations needed.
              {:else}
                Improve memory, focus, and cognitive skills while having fun.
              {/if}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Games Grid -->
  <section id="games" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-center mb-12">Our Games</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each games as game, i}
          <a href={game.href}
             class="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
             in:fly={{ y: 20, duration: 700, delay: 400 + i * 100 }}>
            <div class="absolute inset-0 bg-gradient-to-r {game.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
            <div class="p-6">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">{game.icon}</span>
                <h3 class="text-xl font-semibold">{game.title}</h3>
              </div>
              <p class="text-gray-600">{game.description}</p>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- Call to Action -->
  <section class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl font-bold mb-4">Start Playing Now</h2>
      <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
        Challenge yourself with our collection of brain training games. No sign-up required, just pick a game and start playing!
      </p>
      <a href="#games"
         class="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200">
        Choose Your Game
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center text-gray-500 text-sm">
        <p class="mb-2">© {new Date().getFullYear()} LostMatches.com - Free Online Brain Games</p>
        <p>Challenge your mind with our collection of free puzzle games and brain teasers.</p>
      </div>
    </div>
  </footer>
</main>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
