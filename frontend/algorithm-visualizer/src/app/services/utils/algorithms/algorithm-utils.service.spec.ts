import { TestBed } from '@angular/core/testing';

import { AlgorithmUtilsService } from './algorithm-utils.service';

describe('AlgorithmUtilsService', () => {
  let service: AlgorithmUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlgorithmUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
