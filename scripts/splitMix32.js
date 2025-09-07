// A pseudo-random number generator that accepts seeds
export function splitmix32(a) {
 return function() {
   a |= 0;
   a = a + 0x9e3779b9 | 0;
   let t = a ^ a >>> 16;
   t = Math.imul(t, 0x21f0aaad);
   t = t ^ t >>> 15;
   t = Math.imul(t, 0x735a2d97);
   return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}

// TO GENERATE A SEED, RUN
// let seed = (Math.random()*2**32)>>>0;

// THEN GENERATE A RANDOM NUMBER FUNCTION USING THAT SEED
// const prng = splitmix32(seed);

// FINALLY, GENERATE AS MANY RANDOM NUMBERS AS YOU NEED BY CALLING THE FUNCTION
// let randNum = prng();

// NOTE: Yes, the seed generates the same results in the same order every time.