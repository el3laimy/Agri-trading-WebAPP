/**
 * Seasons API Tests
 * 
 * Tests for api/seasons.js
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { getSeasons, createSeason, updateSeason, deleteSeason } from '../api/seasons';

vi.mock('axios');

describe('Seasons API', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('getSeasons should fetch list', async () => {
        const data = [{ id: 1, name: 'Winter' }];
        axios.get.mockResolvedValue({ data });

        const result = await getSeasons();
        expect(result).toEqual(data);
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/seasons'));
    });

    test('createSeason should post data', async () => {
        const data = { name: 'Summer' };
        axios.post.mockResolvedValue({ data: { id: 2, ...data } });

        const result = await createSeason(data);
        expect(result.id).toBe(2);
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/seasons'), data);
    });

    test('updateSeason should put data', async () => {
        axios.put.mockResolvedValue({ data: { success: true } });

        await updateSeason(1, { active: true });
        expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/seasons/1'), { active: true });
    });

    test('deleteSeason should delete data', async () => {
        axios.delete.mockResolvedValue({ data: { success: true } });

        await deleteSeason(1);
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/seasons/1'));
    });
});
