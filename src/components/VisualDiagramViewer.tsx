import React from 'react';
import { motion } from 'motion/react';
import { VisualDiagram, VisualElement } from '../types';
import {
  ArrowRight,
  RefreshCw,
  Layers,
  GitCompare,
  Calculator,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface VisualDiagramViewerProps {
  diagram: VisualDiagram;
  theme?: 'blackboard' | 'whiteboard' | 'darkroom';
}

export const VisualDiagramViewer: React.FC<VisualDiagramViewerProps> = ({
  diagram,
  theme = 'whiteboard',
}) => {
  if (!diagram || !diagram.elements || diagram.elements.length === 0) {
    return null;
  }

  // 2D Vector Flat Colors for Clean White PPT
  const get2DCardClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm';
      case 'amber':
        return 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm';
      case 'sky':
        return 'bg-sky-50/90 border-sky-300 text-sky-950 shadow-sm';
      case 'violet':
        return 'bg-violet-50/90 border-violet-300 text-violet-950 shadow-sm';
      case 'rose':
        return 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm';
      case 'indigo':
        return 'bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-sm';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm';
    }
  };

  const get2DBadgeClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'sky':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'violet':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300';
    }
  };

  const getDiagramIcon = () => {
    switch (diagram.type) {
      case 'cycle':
        return <RefreshCw className="w-3.5 h-3.5 text-amber-600" />;
      case 'hierarchy':
        return <Layers className="w-3.5 h-3.5 text-sky-600" />;
      case 'comparison':
        return <GitCompare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'formula':
        return <Calculator className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="rounded-xl p-3.5 sm:p-4 bg-white border border-slate-200 shadow-sm select-none">
      {/* 2D Infographic Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-md bg-slate-100 border border-slate-200">
            {getDiagramIcon()}
          </span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {diagram.title || '2D Infographic Model'}
          </h4>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          {diagram.type.replace('_', ' ')}
        </span>
      </div>

      {/* 2D Flow / Process Chain */}
      {(diagram.type === 'flow' || diagram.type === 'timeline') && (
        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          {diagram.elements.map((elem, idx) => {
            const hasNext = idx < diagram.elements.length - 1;
            const connection = diagram.connections?.find(c => c.from === elem.id);

            return (
              <React.Fragment key={elem.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`flex-1 min-w-[110px] max-w-[170px] p-2.5 rounded-xl border flex flex-col items-center text-center ${get2DCardClasses(
                    elem.color
                  )}`}
                >
                  {elem.badge && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mb-1.5 ${get2DBadgeClasses(
                        elem.color
                      )}`}
                    >
                      {elem.badge}
                    </span>
                  )}
                  <p className="text-xs font-bold leading-tight line-clamp-2 text-slate-900">
                    {elem.label}
                  </p>
                  {elem.sublabel && (
                    <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 font-medium">
                      {elem.sublabel}
                    </p>
                  )}
                </motion.div>

                {hasNext && (
                  <div className="flex flex-col items-center px-0.5">
                    {connection?.label ? (
                      <span className="text-[9px] font-semibold px-1 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200 mb-0.5">
                        {connection.label}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 2D Cycle Infographic */}
      {diagram.type === 'cycle' && (
        <div className="py-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {diagram.elements.map((elem, idx) => (
              <motion.div
                key={elem.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`p-2.5 rounded-xl border flex flex-col items-start ${get2DCardClasses(
                  elem.color
                )}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-slate-500">
                    Step {idx + 1}
                  </span>
                  {elem.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${get2DBadgeClasses(
                        elem.color
                      )}`}
                    >
                      {elem.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold leading-tight text-slate-900">{elem.label}</p>
                {elem.sublabel && (
                  <p className="text-[10px] text-slate-600 mt-0.5 font-medium">{elem.sublabel}</p>
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-amber-700 font-semibold bg-amber-50 py-1 px-2.5 rounded-md border border-amber-200/70">
            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin-slow" />
            <span>Continuous regenerative cycle</span>
          </div>
        </div>
      )}

      {/* 2D Comparison Matrix */}
      {diagram.type === 'comparison' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 py-1">
          {diagram.elements.map((elem, idx) => (
            <motion.div
              key={elem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.07 }}
              className={`p-3 rounded-xl border flex flex-col justify-between ${get2DCardClasses(
                elem.color
              )}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
                    {elem.label}
                  </p>
                  {elem.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${get2DBadgeClasses(
                        elem.color
                      )}`}
                    >
                      {elem.badge}
                    </span>
                  )}
                </div>
                {elem.sublabel && (
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    {elem.sublabel}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 2D Hierarchy / Step Flow */}
      {(diagram.type === 'hierarchy' || diagram.type === 'formula') && (
        <div className="space-y-2 py-1">
          {diagram.elements.map((elem, idx) => (
            <motion.div
              key={elem.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${get2DCardClasses(
                elem.color
              )}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold leading-tight text-slate-900">{elem.label}</p>
                  {elem.sublabel && (
                    <p className="text-[10px] text-slate-600 font-medium">{elem.sublabel}</p>
                  )}
                </div>
              </div>
              {elem.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${get2DBadgeClasses(
                    elem.color
                  )}`}
                >
                  {elem.badge}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Footnote */}
      {diagram.summaryFootnote && (
        <p className="text-[10px] italic mt-2.5 pt-1.5 border-t border-slate-100 text-center text-slate-500 font-medium">
          {diagram.summaryFootnote}
        </p>
      )}
    </div>
  );
};
