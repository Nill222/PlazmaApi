/**
 * @fileoverview Type declarations for docx.js library (loaded from CDN)
 * @see https://github.com/dolanmedia/docx
 */

/**
 * @namespace
 * @name docx
 */

/**
 * @class
 * @name Document
 * @memberof docx
 * @param {Object} options
 * @param {Array} options.sections
 */

/**
 * @namespace
 * @name Packer
 * @memberof docx
 */

/**
 * @function Packer.toBlob
 * @param {Document} doc
 * @returns {Promise<Blob>}
 */

/**
 * @namespace
 * @name AlignmentType
 * @memberof docx
 * @property {string} CENTER
 * @property {string} LEFT
 * @property {string} RIGHT
 */

/**
 * @namespace
 * @name HeadingLevel
 * @memberof docx
 * @property {string} HEADING_1
 * @property {string} HEADING_2
 */

/**
 * @namespace
 * @name WidthType
 * @memberof docx
 * @property {string} PERCENTAGE
 */

/**
 * @namespace
 * @name BorderStyle
 * @memberof docx
 * @property {string} NIL
 */

/**
 * @namespace
 * @name ShadingType
 * @memberof docx
 * @property {string} SOLID
 */

/**
 * @class
 * @name Paragraph
 * @memberof docx
 * @param {Object} options
 */

/**
 * @class
 * @name TextRun
 * @memberof docx
 * @param {Object} options
 */

/**
 * @class
 * @name ImageRun
 * @memberof docx
 * @param {Object} options
 */

/**
 * @class
 * @name Table
 * @memberof docx
 * @param {Object} options
 */

/**
 * @class
 * @name TableRow
 * @memberof docx
 * @param {Object} options
 */

/**
 * @class
 * @name TableCell
 * @memberof docx
 * @param {Object} options
 */

/**
 * @typedef {Object} SimStats
 * @property {number} totalTransferredEnergy
 * @property {number} avgTransferredPerAtom
 * @property {number} finalProbeTemperature
 * @property {number} surfaceBindingEnergy
 * @property {number} debyeFrontSpeed
 * @property {number} debyeFrontDepth
 * @property {number} electronDensity
 * @property {number} electronVelocity
 * @property {number} currentDensity
 * @property {number} totalDamage
 * @property {number} totalMomentum
 * @property {number} totalDisplacement
 * @property {number} fluence
 * @property {number} fluenceEff
 * @property {number} ionFlux
 * @property {number} resonanceXi
 * @property {number} dSlr
 * @property {number} dRes
 * @property {Array<number>} [thermalTimes]
 * @property {Array<number>} [thermalDepths]
 * @property {Array<Array<number>>} [thermalTemperatureMap]
 * @property {Array<number>} [perAtomTransferredEnergies]
 * @property {Array<number>} [coolingProfile]
 */