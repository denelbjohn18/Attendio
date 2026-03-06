import { describe, it, expect, vi } from 'vitest';
import * as faceapi from 'face-api.js';

describe('Face Recognition Core Logic', () => {
    it('Should correctly format descriptors for Supabase', () => {
        // Generate a mock descriptor (128 floats)
        const mockDescriptor = new Float32Array(128).fill(0.5);

        // Simulate formatting loop from Registration.jsx
        const embeddingString = `[${Array.from(mockDescriptor).join(',')}]`;

        expect(typeof embeddingString).toBe('string');
        expect(embeddingString.startsWith('[')).toBe(true);
        expect(embeddingString.endsWith(']')).toBe(true);

        // Verify it parses back correctly
        const parsed = JSON.parse(embeddingString);
        expect(parsed.length).toBe(128);
        expect(parsed[0]).toBeCloseTo(0.5);
    });

    it('Should average 3 descriptors correctly for an anchor', () => {
        const desc1 = new Array(128).fill(0.2);
        const desc2 = new Array(128).fill(0.4);
        const desc3 = new Array(128).fill(0.6);

        const anchorSum = new Array(128).fill(0);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 128; j++) {
                anchorSum[j] += [desc1, desc2, desc3][i][j];
            }
        }
        const finalDescriptor = anchorSum.map(val => val / 3);

        expect(finalDescriptor.length).toBe(128);
        expect(finalDescriptor[0]).toBeCloseTo(0.4); // Average of 0.2, 0.4, 0.6
    });
});
